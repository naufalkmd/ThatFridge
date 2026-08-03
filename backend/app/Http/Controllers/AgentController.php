<?php

namespace App\Http\Controllers;

use App\Services\AgentService;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    protected $agentService;

    public function __construct(AgentService $agentService)
    {
        $this->agentService = $agentService;
    }

    /**
     * Get the authenticated user's chat history, oldest first.
     */
    public function history(Request $request)
    {
        $messages = $request->user()->chatHistory()->orderBy('created_at')->get([
            'id', 'agent', 'user_message', 'agent_response', 'created_at',
        ]);

        return response()->json([
            'messages' => $messages,
        ], 200);
    }

    /**
     * Send message to agent, persist the exchange, and return the response
     */
    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'agent' => 'required|in:Chef,Guardian,Organizer,Shopkeeper',
            'inventory' => 'nullable|string', // JSON string of inventory for context
        ]);

        $result = $this->agentService->chat(
            $request->input('message'),
            $request->input('agent'),
            $request->input('inventory')
        );

        if (!$result) {
            return response()->json(['error' => 'Failed to get agent response'], 500);
        }

        $record = $request->user()->chatHistory()->create([
            'agent' => $result['agent'],
            'user_message' => $result['user_message'],
            'agent_response' => $result['agent_response'],
        ]);

        return response()->json([
            'id' => $record->id,
            'user_message' => $record->user_message,
            'agent' => $record->agent,
            'agent_response' => $record->agent_response,
            'created_at' => $record->created_at->toIso8601String(),
        ], 200);
    }
}
