<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SlotManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_patient_cannot_access_the_slots_page(): void
    {
        $patient = User::factory()->create();

        $this->actingAs($patient)
            ->get(route('slots.index'))
            ->assertForbidden();
    }

    public function test_a_practitioner_can_view_the_slots_page(): void
    {
        $practitioner = User::factory()->practitioner()->create();

        $this->actingAs($practitioner)
            ->get(route('slots.index'))
            ->assertOk();
    }

    public function test_a_practitioner_can_generate_slots_in_batch(): void
    {
        $practitioner = User::factory()->practitioner()->create();
        $day = now()->addDay();

        $this->actingAs($practitioner)
            ->post(route('slots.batch'), [
                'from_date' => $day->toDateString(),
                'to_date' => $day->toDateString(),
                'weekdays' => [$day->dayOfWeekIso],
                'start_time' => '09:00',
                'end_time' => '11:00',
                'duration' => 30,
            ])
            ->assertRedirect();

        // 09:00 → 11:00 par pas de 30 min = 4 créneaux.
        $this->assertSame(4, $practitioner->slots()->count());
    }

    public function test_batch_generation_skips_overlapping_slots(): void
    {
        $practitioner = User::factory()->practitioner()->create();
        $day = now()->addDay();

        // Un créneau existant 09:00–09:30.
        $practitioner->slots()->create([
            'starts_at' => $day->copy()->setTime(9, 0),
            'ends_at' => $day->copy()->setTime(9, 30),
        ]);

        $this->actingAs($practitioner)->post(route('slots.batch'), [
            'from_date' => $day->toDateString(),
            'to_date' => $day->toDateString(),
            'weekdays' => [$day->dayOfWeekIso],
            'start_time' => '09:00',
            'end_time' => '10:00',
            'duration' => 30,
        ]);

        // 09:00–09:30 ignoré (chevauche), 09:30–10:00 créé => 2 au total.
        $this->assertSame(2, $practitioner->slots()->count());
    }

    public function test_a_practitioner_can_delete_their_available_slot(): void
    {
        $practitioner = User::factory()->practitioner()->create();
        $slot = Slot::factory()->for($practitioner, 'practitioner')->create();

        $this->actingAs($practitioner)
            ->delete(route('slots.destroy', $slot))
            ->assertRedirect();

        $this->assertDatabaseMissing('slots', ['id' => $slot->id]);
    }

    public function test_a_practitioner_cannot_delete_another_practitioners_slot(): void
    {
        $owner = User::factory()->practitioner()->create();
        $other = User::factory()->practitioner()->create();
        $slot = Slot::factory()->for($owner, 'practitioner')->create();

        $this->actingAs($other)
            ->delete(route('slots.destroy', $slot))
            ->assertForbidden();

        $this->assertDatabaseHas('slots', ['id' => $slot->id]);
    }

    public function test_a_booked_slot_cannot_be_deleted(): void
    {
        $practitioner = User::factory()->practitioner()->create();
        $slot = Slot::factory()->for($practitioner, 'practitioner')->create();

        $slot->appointments()->create([
            'patient_id' => User::factory()->create()->id,
            'status' => AppointmentStatus::Scheduled,
        ]);

        $this->actingAs($practitioner)->delete(route('slots.destroy', $slot));

        // Le créneau réservé est toujours là.
        $this->assertDatabaseHas('slots', ['id' => $slot->id]);
    }
}
