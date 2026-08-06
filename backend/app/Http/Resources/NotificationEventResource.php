<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationEventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'fridgeId' => (string) $this->fridge_id,
            'fridgeName' => $this->fridge->name,
            'itemId' => $this->item_id !== null ? (string) $this->item_id : null,
            'kind' => $this->kind,
            'message' => $this->message,
            'createdAt' => $this->created_at->getTimestamp() * 1000,
            'done' => (bool) $this->done,
        ];
    }
}
