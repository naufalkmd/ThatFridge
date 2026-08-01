<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgentService
{
    protected $apiKey;
    protected $baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('OPENROUTER_API_KEY');
    }

    /**
     * Send message to agent and get response
     */
    public function chat($message, $agent = 'Chef', $inventory = null)
    {
        try {
            $systemPrompt = $this->getSystemPrompt($agent, $inventory);
            
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'HTTP-Referer' => env('APP_URL'),
                'X-Title' => 'ThatFridge',
            ])->post($this->baseUrl, [
                'model' => 'google/gemini-2.0-flash-001',
                'max_tokens' => 1000,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt
                    ],
                    [
                        'role' => 'user',
                        'content' => $message
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $agentResponse = $data['choices'][0]['message']['content'] ?? 'No response';
                
                return [
                    'agent' => $agent,
                    'user_message' => $message,
                    'agent_response' => $agentResponse,
                    'status' => 'success',
                ];
            }

            Log::error('OpenRouter API error', ['status' => $response->status(), 'body' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Agent chat failed', ['agent' => $agent, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get system prompt based on agent type
     */
    private function getSystemPrompt($agent, $inventory = null)
    {
        $inventoryContext = $inventory ? "\n\nCurrent inventory:\n" . $inventory : '';

        $prompts = [
            'Chef' => "You are Chef. Your role is to suggest recipes and meals based on available ingredients. Prioritize items that are expiring soon. Be enthusiastic about cooking! Keep responses concise (2-3 sentences)." . $inventoryContext,
            
            'Guardian' => "You are Guardian. Your role is to alert about food safety issues and spoilage. Flag items that are expired or close to expiring. Warn about risky storage. Be direct and clear about safety concerns. Keep responses concise (2-3 sentences)." . $inventoryContext,
            
            'Organizer' => "You are Organizer. Your role is to suggest optimal storage locations for items (fridge, freezer, pantry). Explain why each storage location is best for that food. Help maintain an organized fridge. Keep responses concise (2-3 sentences)." . $inventoryContext,
            
            'Shopkeeper' => "You are Shopkeeper. Your role is to recommend items to buy based on what's running low in inventory. Suggest quantities. Consider meal planning needs. Keep responses concise (2-3 sentences)." . $inventoryContext,
        ];

        return $prompts[$agent] ?? $prompts['Chef'];
    }

    /**
     * Get all agent names
     */
    public function getAgents()
    {
        return ['Chef', 'Guardian', 'Organizer', 'Shopkeeper'];
    }
}