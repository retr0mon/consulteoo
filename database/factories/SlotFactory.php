<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

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
        // fake() renvoie un DateTime MUTABLE : on clone avant de modifier
        // pour ne pas décaler aussi la date de début.
        $startsAt = fake()->dateTimeBetween('now', '+2 weeks');
        $endsAt = (clone $startsAt)->modify('+30 minutes');

        return [
            // Une factory peut recevoir une autre factory :
            // Laravel crée un praticien et injecte son id.
            'practitioner_id' => User::factory()->practitioner(),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
        ];
    }
}
