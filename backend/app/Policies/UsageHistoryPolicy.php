<?php

namespace App\Policies;

use App\Models\UsageHistory;
use App\Models\User;

class UsageHistoryPolicy
{
    public function delete(User $user, UsageHistory $usageHistory): bool
    {
        return $usageHistory->user_id === $user->id;
    }
}
