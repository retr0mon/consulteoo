import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AvailableSlot, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
});
const timeFmt = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
});

export default function Book({ slots }: { slots: AvailableSlot[] }) {
    const { flash } = usePage<PageProps>().props;
    const [bookingId, setBookingId] = useState<number | null>(null);

    const book = (slotId: number) => {
        setBookingId(slotId);
        router.post(
            route('appointments.store'),
            { slot_id: slotId },
            {
                preserveScroll: true,
                onFinish: () => setBookingId(null),
            },
        );
    };

    // Regroupe les créneaux par jour (les slots arrivent déjà triés par date).
    const groups = slots.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
        const key = slot.starts_at.slice(0, 10);
        (acc[key] ??= []).push(slot);
        return acc;
    }, {});

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Prendre rendez-vous
                </h2>
            }
        >
            <Head title="Prendre rendez-vous" />

            <div className="py-10">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                            {flash.error}
                        </div>
                    )}

                    {slots.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                            <p className="text-sm font-medium text-gray-900">
                                Aucun créneau disponible pour le moment.
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Revenez plus tard : les praticiens publient
                                régulièrement de nouvelles disponibilités.
                            </p>
                        </div>
                    ) : (
                        Object.entries(groups).map(([date, daySlots]) => (
                            <div
                                key={date}
                                className="rounded-2xl border border-gray-100 bg-white shadow-sm"
                            >
                                <div className="border-b border-gray-100 px-6 py-4">
                                    <h3 className="text-base font-semibold capitalize text-gray-900">
                                        {dateFmt.format(new Date(daySlots[0].starts_at))}
                                    </h3>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    {daySlots.map((slot) => (
                                        <li
                                            key={slot.id}
                                            className="flex items-center justify-between px-6 py-4"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {timeFmt.format(
                                                        new Date(slot.starts_at),
                                                    )}{' '}
                                                    –{' '}
                                                    {timeFmt.format(
                                                        new Date(slot.ends_at),
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {slot.practitioner.name}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => book(slot.id)}
                                                disabled={bookingId === slot.id}
                                                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {bookingId === slot.id
                                                    ? 'Réservation…'
                                                    : 'Réserver'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
