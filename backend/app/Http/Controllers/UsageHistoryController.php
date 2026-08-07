<?php

namespace App\Http\Controllers;

use App\Http\Resources\UsageHistoryResource;
use App\Models\UsageHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UsageHistoryController extends Controller
{
    public function index(Request $request)
    {
        $entries = $request->user()->usageHistory()->orderByDesc('last_used_at')->get();

        return UsageHistoryResource::collection($entries);
    }

    /**
     * Record that an item was used up - increments the existing entry for this item name
     * if one exists, otherwise creates one. This is what makes "Shopkeeper remembers items
     * you use often" actually true: AgentService reads this back into the agent's prompt
     * (see buildUsageSummary on the frontend) instead of it just sitting in a list no one
     * but the user ever looks at.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['required', 'string', 'max:255'],
        ]);

        $key = Str::lower(trim($data['name']));

        $entry = $request->user()->usageHistory()->where('key', $key)->first();

        if ($entry) {
            $entry->update([
                'count' => $entry->count + 1,
                'last_used_at' => now(),
                'name' => $data['name'],
                'icon' => $data['icon'],
            ]);
        } else {
            $entry = $request->user()->usageHistory()->create([
                'key' => $key,
                'name' => $data['name'],
                'icon' => $data['icon'],
                'count' => 1,
                'last_used_at' => now(),
            ]);
        }

        return new UsageHistoryResource($entry);
    }

    public function destroy(Request $request, UsageHistory $usageHistory)
    {
        $this->authorize('delete', $usageHistory);

        $usageHistory->delete();

        return response()->noContent();
    }

    public function clear(Request $request)
    {
        $request->user()->usageHistory()->delete();

        return response()->noContent();
    }
}
