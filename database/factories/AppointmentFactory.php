<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slot_id' => Slot::factory(),
            'patient_id' => User::factory(), // rôle patient par défaut
            'status' => AppointmentStatus::Scheduled,
            'reason' => fake()->optional()->sentence(),
        ];
    }

    /**
     * RDV annulé.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AppointmentStatus::Cancelled,
        ]);
    }

    /**
     * RDV honoré.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AppointmentStatus::Completed,
        ]);
    }
}
