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
     * Get chat history (mock for now)
     */
    public function history(Request $request)
    {
        // In real implementation, fetch from ChatHistory table
        return response()->json([
            'messages' => [],
            'message' => 'Chat history endpoint (will pull from database when Track A is ready)',
        ], 200);
    }

    /**
     * Send message to agent and get response
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

        return response()->json([
            'id' => rand(1, 100000),
            'user_message' => $result['user_message'],
            'agent' => $result['agent'],
            'agent_response' => $result['agent_response'],
            'created_at' => now()->toIso8601String(),
        ], 200);
    }
}