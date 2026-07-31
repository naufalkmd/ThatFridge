<?php

namespace App\Policies;

use App\Models\ShoppingItem;
use App\Models\User;

class ShoppingItemPolicy
{
    public function update(User $user, ShoppingItem $shoppingItem): bool
    {
        return $shoppingItem->user_id === $user->id;
    }

    public function delete(User $user, ShoppingItem $shoppingItem): bool
    {
        return $shoppingItem->user_id === $user->id;
    }
}
