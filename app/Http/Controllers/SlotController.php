<?php

namespace App\Http\Controllers;

use App\Models\Slot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SlotController extends Controller
{
    /**
     * Affiche les créneaux du praticien connecté (+ le formulaire de création).
     */
    public function index(Request $request): Response
    {
        $slots = $request->user()
            ->slots()
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('Slots/Index', [
            'slots' => $slots,
        ]);
    }

    /**
     * Génère plusieurs créneaux d'un coup sur une période donnée.
     */
    public function storeBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'from_date' => ['required', 'date', 'after_or_equal:today'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'weekdays' => ['required', 'array', 'min:1'],
            'weekdays.*' => ['integer', 'between:1,7'], // 1 = lundi … 7 = dimanche (ISO)
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'duration' => ['required', 'integer', 'min:5', 'max:240'],
        ]);

        $from = Carbon::parse($validated['from_date'])->startOfDay();
        $to = Carbon::parse($validated['to_date'])->startOfDay();

        // Garde-fou : on limite l'amplitude pour éviter une génération démesurée.
        if ($from->diffInDays($to) > 92) {
            throw ValidationException::withMessages([
                'to_date' => 'La période ne peut pas dépasser 3 mois.',
            ]);
        }

        [$startHour, $startMin] = array_map('intval', explode(':', $validated['start_time']));
        [$endHour, $endMin] = array_map('intval', explode(':', $validated['end_time']));
        $duration = $validated['duration'];
        $weekdays = $validated['weekdays'];

        // 1. Construire la liste des créneaux candidats.
        $candidates = [];
        for ($date = $from->copy(); $date->lte($to); $date->addDay()) {
            if (! in_array($date->dayOfWeekIso, $weekdays, true)) {
                continue;
            }

            $cursor = $date->copy()->setTime($startHour, $startMin);
            $dayEnd = $date->copy()->setTime($endHour, $endMin);

            // Tant qu'un créneau entier tient avant la fin de la plage.
            while ($cursor->copy()->addMinutes($duration)->lte($dayEnd)) {
                $slotStart = $cursor->copy();
                $slotEnd = $cursor->copy()->addMinutes($duration);

                if ($slotStart->isFuture()) {
                    $candidates[] = ['starts_at' => $slotStart, 'ends_at' => $slotEnd];
                }

                $cursor->addMinutes($duration);
            }
        }

        // 2. Insérer en base, en ignorant les chevauchements, dans une transaction.
        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($request, $candidates, &$created, &$skipped) {
            foreach ($candidates as $slot) {
                $overlaps = $request->user()->slots()
                    ->where('starts_at', '<', $slot['ends_at'])
                    ->where('ends_at', '>', $slot['starts_at'])
                    ->exists();

                if ($overlaps) {
                    $skipped++;

                    continue;
                }

                $request->user()->slots()->create($slot);
                $created++;
            }
        });

        $message = "{$created} créneau(x) créé(s).";
        if ($skipped > 0) {
            $message .= " {$skipped} ignoré(s) (chevauchement).";
        }

        return redirect()->route('slots.index')->with('success', $message);
    }

    /**
     * Supprime un créneau du praticien connecté.
     */
    public function destroy(Request $request, Slot $slot): RedirectResponse
    {
        // Le praticien ne peut supprimer que SES créneaux.
        abort_unless($slot->practitioner_id === $request->user()->id, 403);

        // On refuse de supprimer un créneau déjà réservé (RDV programmé).
        if (! $slot->isAvailable()) {
            return back()->with('error', 'Impossible de supprimer un créneau déjà réservé.');
        }

        $slot->delete();

        return back()->with('success', 'Créneau supprimé.');
    }
}
