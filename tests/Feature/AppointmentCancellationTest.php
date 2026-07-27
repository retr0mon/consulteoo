<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_patient_can_cancel_their_appointment_and_free_the_slot(): void
    {
        $patient = User::factory()->create();
        $slot = Slot::factory()->create([
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);
        $appointment = $slot->appointments()->create([
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::Scheduled,
        ]);

        $this->actingAs($patient)
            ->patch(route('appointments.cancel', $appointment))
            ->assertRedirect();

        $this->assertSame(
            AppointmentStatus::Cancelled,
            $appointment->refresh()->status,
        );

        // Le créneau est de nouveau disponible.
        $this->assertTrue($slot->refresh()->isAvailable());
    }

    public function test_a_patient_cannot_cancel_someone_elses_appointment(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $slot = Slot::factory()->create([
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);
        $appointment = $slot->appointments()->create([
            'patient_id' => $owner->id,
            'status' => AppointmentStatus::Scheduled,
        ]);

        $this->actingAs($intruder)
            ->patch(route('appointments.cancel', $appointment))
            ->assertForbidden();

        // Le RDV reste programmé.
        $this->assertSame(
            AppointmentStatus::Scheduled,
            $appointment->refresh()->status,
        );
    }
}
