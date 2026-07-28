<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['fridge_id', 'name', 'position'])]
class Section extends Model
{
    public function fridge(): BelongsTo
    {
        return $this->belongsTo(Fridge::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }
}
