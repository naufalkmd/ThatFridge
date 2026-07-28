<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['fridge_id', 'kind', 'message', 'done'])]
class NotificationEvent extends Model
{
    protected function casts(): array
    {
        return [
            'done' => 'boolean',
        ];
    }

    public function fridge(): BelongsTo
    {
        return $this->belongsTo(Fridge::class);
    }
}
