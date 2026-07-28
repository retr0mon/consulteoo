<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SlotController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    // Pas de page d'accueil publique : on redirige selon l'état de connexion.
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Espace praticien : gestion de ses créneaux (réservé aux praticiens).
Route::middleware(['auth', 'verified', 'practitioner'])->group(function () {
    Route::get('/slots', [SlotController::class, 'index'])->name('slots.index');
    Route::post('/slots/batch', [SlotController::class, 'storeBatch'])->name('slots.batch');
    Route::delete('/slots/{slot}', [SlotController::class, 'destroy'])->name('slots.destroy');
});

// Espace patient : réservation de créneaux.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/book', [AppointmentController::class, 'create'])->name('appointments.create');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
});

require __DIR__.'/auth.php';
