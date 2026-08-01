<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach ([
            ['name' => 'Keira', 'email' => 'keira@thatfridge.test'],
            ['name' => 'Hazim', 'email' => 'hazim@thatfridge.test'],
            ['name' => 'Joey', 'email' => 'joey@thatfridge.test'],
            ['name' => 'Kemed', 'email' => 'kemed@thatfridge.test'],
        ] as $attrs) {
            User::factory()->create([
                ...$attrs,
                'password' => 'password123',
            ]);
        }
    }
}
