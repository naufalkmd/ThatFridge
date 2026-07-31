<?php

namespace App\Http\Controllers;

use App\Http\Resources\NotificationPrefResource;
use Illuminate\Http\Request;

class NotificationPrefController extends Controller
{
    public function show(Request $request)
    {
        $pref = $request->user()->notificationPref()->firstOrCreate([], [
            'expiry_alerts' => true,
            'low_stock' => true,
            'recipe_tips' => true,
            'weekly_digest' => true,
        ]);

        return new NotificationPrefResource($pref);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'expiryAlerts' => ['sometimes', 'boolean'],
            'lowStock' => ['sometimes', 'boolean'],
            'recipeTips' => ['sometimes', 'boolean'],
            'weeklyDigest' => ['sometimes', 'boolean'],
        ]);

        $pref = $request->user()->notificationPref()->firstOrCreate([], [
            'expiry_alerts' => true,
            'low_stock' => true,
            'recipe_tips' => true,
            'weekly_digest' => true,
        ]);

        $pref->update([
            'expiry_alerts' => $data['expiryAlerts'] ?? $pref->expiry_alerts,
            'low_stock' => $data['lowStock'] ?? $pref->low_stock,
            'recipe_tips' => $data['recipeTips'] ?? $pref->recipe_tips,
            'weekly_digest' => $data['weeklyDigest'] ?? $pref->weekly_digest,
        ]);

        return new NotificationPrefResource($pref);
    }
}
