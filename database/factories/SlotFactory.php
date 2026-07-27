<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<\App\Models\Slot>
 */
class SlotFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Heure alignée au quart d'heure (minutes ∈ {0,15,30,45}, secondes à 0),
        // pour un jeu de données cohérent avec le pas de l'application.
        $duration = fake()->randomElement([15, 30, 45, 60]);

        $startsAt = Carbon::instance(fake()->dateTimeBetween('now', '+2 weeks'))
            ->setTime(
                fake()->numberBetween(8, 18),
                fake()->randomElement([0, 15, 30, 45]),
                0,
            );

        return [
            // Une factory peut recevoir une autre factory :
            // Laravel crée un praticien et injecte son id.
            'practitioner_id' => User::factory()->practitioner(),
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($duration),
        ];
    }
}
