<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SlotController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
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

require __DIR__.'/auth.php';
