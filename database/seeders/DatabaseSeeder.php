<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Peuple la base avec des données réalistes.
     */
    public function run(): void
    {
        // --- Comptes de test (identifiants connus, mot de passe : "password") ---
        $doctor = User::factory()->practitioner()->create([
            'name' => 'Dr. Sarah Martin',
            'email' => 'praticien@consulteoo.test',
        ]);

        $patient = User::factory()->create([
            'name' => 'Jean Dupont',
            'email' => 'patient@consulteoo.test',
        ]);

        // Notre praticien de test a lui aussi des créneaux
        Slot::factory()->count(8)->for($doctor, 'practitioner')->create();

        // --- 3 autres praticiens, chacun avec 8 créneaux ---
        User::factory()
            ->practitioner()
            ->count(3)
            ->has(Slot::factory()->count(8), 'slots')
            ->create();

        // --- 10 patients (+ notre patient de test) ---
        $patients = User::factory()->count(10)->create();
        $patients->push($patient);

        // --- Réserver 12 créneaux au hasard ---
        Slot::inRandomOrder()->take(12)->get()->each(function (Slot $slot) use ($patients) {
            Appointment::factory()->create([
                'slot_id' => $slot->id,
                'patient_id' => $patients->random()->id,
            ]);
        });
    }
}
