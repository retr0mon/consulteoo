<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_patient_can_book_an_available_slot(): void
    {
        $patient = User::factory()->create();
        $slot = Slot::factory()->create([
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);

        $this->actingAs($patient)
            ->post(route('appointments.store'), ['slot_id' => $slot->id])
            ->assertRedirect();

        $this->assertDatabaseHas('appointments', [
            'slot_id' => $slot->id,
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::Scheduled->value,
        ]);
    }

    public function test_a_slot_cannot_be_double_booked(): void
    {
        $slot = Slot::factory()->create([
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);

        // Un premier patient a déjà réservé.
        $slot->appointments()->create([
            'patient_id' => User::factory()->create()->id,
            'status' => AppointmentStatus::Scheduled,
        ]);

        // Un second patient tente le même créneau.
        $this->actingAs(User::factory()->create())
            ->post(route('appointments.store'), ['slot_id' => $slot->id]);

        // Toujours un seul RDV programmé sur ce créneau.
        $this->assertSame(
            1,
            $slot->appointments()
                ->where('status', AppointmentStatus::Scheduled)
                ->count(),
        );
    }

    public function test_available_list_excludes_booked_and_past_slots(): void
    {
        $patient = User::factory()->create();

        $available = Slot::factory()->create([
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);

        // Passé → exclu.
        Slot::factory()->create([
            'starts_at' => now()->subDay()->setTime(10, 0),
            'ends_at' => now()->subDay()->setTime(10, 30),
        ]);

        // Déjà réservé → exclu.
        $booked = Slot::factory()->create([
            'starts_at' => now()->addDay()->setTime(11, 0),
            'ends_at' => now()->addDay()->setTime(11, 30),
        ]);
        $booked->appointments()->create([
            'patient_id' => User::factory()->create()->id,
            'status' => AppointmentStatus::Scheduled,
        ]);

        $this->actingAs($patient)
            ->get(route('appointments.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Appointments/Book')
                ->has('slots', 1)
                ->where('slots.0.id', $available->id));
    }
}
