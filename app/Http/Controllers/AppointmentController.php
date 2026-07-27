<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
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
}
