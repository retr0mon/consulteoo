<?php

use App\Enums\AppointmentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table "appointments" (la réservation d'un créneau par un patient).
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            // slot_id : la convention devine la table "slots"
            $table->foreignId('slot_id')
                ->constrained()
                ->cascadeOnDelete();
            // patient_id : on précise la table "users"
            $table->foreignId('patient_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('status')->default(AppointmentStatus::Scheduled->value);
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Supprime la table "appointments".
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
