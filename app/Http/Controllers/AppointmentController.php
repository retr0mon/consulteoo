<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Slot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    /**
     * Affiche les créneaux disponibles à la réservation.
     */
    public function create(): Response
    {
        $slots = Slot::query()
            ->where('starts_at', '>', now())
            ->whereDoesntHave('appointments', function (Builder $query) {
                $query->where('status', AppointmentStatus::Scheduled);
            })
            ->with('practitioner:id,name')
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('Appointments/Book', [
            'slots' => $slots,
        ]);
    }

    /**
     * Réserve un créneau pour le patient connecté (protégé contre le double-booking).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'slot_id' => ['required', 'integer', 'exists:slots,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $booked = DB::transaction(function () use ($request, $validated) {
            // 🔒 Verrou sur la ligne du créneau : les réservations concurrentes
            //    s'exécutent l'une après l'autre (pas de race condition).
            $slot = Slot::whereKey($validated['slot_id'])->lockForUpdate()->first();

            // Le créneau doit exister et être dans le futur.
            if (! $slot || $slot->starts_at->isPast()) {
                return false;
            }

            // Déjà réservé ? (un autre patient a pu passer avant)
            $alreadyTaken = $slot->appointments()
                ->where('status', AppointmentStatus::Scheduled)
                ->exists();

            if ($alreadyTaken) {
                return false;
            }

            $slot->appointments()->create([
                'patient_id' => $request->user()->id,
                'status' => AppointmentStatus::Scheduled,
                'reason' => $validated['reason'] ?? null,
            ]);

            return true;
        });

        return $booked
            ? back()->with('success', 'Rendez-vous confirmé !')
            : back()->with('error', "Désolé, ce créneau n'est plus disponible.");
    }

    /**
     * Liste les rendez-vous de l'utilisateur (les siens s'il est patient,
     * ceux reçus sur ses créneaux s'il est praticien).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $mode = $user->isPractitioner() ? 'practitioner' : 'patient';

        if ($user->isPractitioner()) {
            $appointments = Appointment::query()
                ->whereHas('slot', fn (Builder $query) => $query->where('practitioner_id', $user->id))
                ->with(['slot', 'patient:id,name'])
                ->get();
        } else {
            $appointments = $user->appointments()
                ->with(['slot.practitioner:id,name'])
                ->get();
        }

        // Format uniforme, trié par date de début du créneau.
        $data = $appointments
            ->sortBy(fn (Appointment $appointment) => $appointment->slot->starts_at)
            ->values()
            ->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'starts_at' => $appointment->slot->starts_at,
                'ends_at' => $appointment->slot->ends_at,
                'status' => $appointment->status,
                'party' => $mode === 'practitioner'
                    ? $appointment->patient->name
                    : $appointment->slot->practitioner->name,
            ]);

        return Inertia::render('Appointments/Index', [
            'appointments' => $data,
            'mode' => $mode,
        ]);
    }

    /**
     * Annule un rendez-vous (patient propriétaire uniquement) → relibère le créneau.
     */
    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->patient_id === $request->user()->id, 403);

        if (
            $appointment->status !== AppointmentStatus::Scheduled
            || $appointment->slot->starts_at->isPast()
        ) {
            return back()->with('error', 'Ce rendez-vous ne peut pas être annulé.');
        }

        $appointment->update(['status' => AppointmentStatus::Cancelled]);

        return back()->with('success', 'Rendez-vous annulé. Le créneau est de nouveau disponible.');
    }
}
