import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AppointmentRow, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

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

const STATUS: Record<
    AppointmentRow['status'],
    { label: string; className: string }
> = {
    scheduled: { label: 'Programmé', className: 'bg-indigo-50 text-indigo-700' },
    cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-700' },
    completed: { label: 'Honoré', className: 'bg-emerald-50 text-emerald-700' },
};

export default function Index({
    appointments,
    mode,
}: {
    appointments: AppointmentRow[];
    mode: 'patient' | 'practitioner';
}) {
    const { flash } = usePage<PageProps>().props;
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const now = Date.now();
    const isUpcoming = (a: AppointmentRow) =>
        a.status === 'scheduled' && new Date(a.starts_at).getTime() > now;

    const upcoming = appointments.filter(isUpcoming);
    const history = appointments.filter((a) => !isUpcoming(a));

    const partyLabel = mode === 'patient' ? 'Praticien' : 'Patient';

    const cancel = (id: number) => {
        if (confirm('Annuler ce rendez-vous ?')) {
            setCancellingId(id);
            router.patch(
                route('appointments.cancel', id),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => setCancellingId(null),
                },
            );
        }
    };

    const row = (a: AppointmentRow, cancellable: boolean): ReactNode => (
        <li
            key={a.id}
            className="flex items-center justify-between px-6 py-4"
        >
            <div>
                <p className="text-sm font-medium capitalize text-gray-900">
                    {dateFmt.format(new Date(a.starts_at))}
                </p>
                <p className="text-sm text-gray-500">
                    {timeFmt.format(new Date(a.starts_at))} –{' '}
                    {timeFmt.format(new Date(a.ends_at))} · {partyLabel} : {a.party}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[a.status].className}`}
                >
                    {STATUS[a.status].label}
                </span>
                {cancellable && mode === 'patient' && (
                    <button
                        type="button"
                        onClick={() => cancel(a.id)}
                        disabled={cancellingId === a.id}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                        {cancellingId === a.id ? 'Annulation…' : 'Annuler'}
                    </button>
                )}
            </div>
        </li>
    );

    const card = (title: string, items: AppointmentRow[], cancellable: boolean) => (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            {items.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-gray-500">
                    Rien à afficher.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((a) => row(a, cancellable))}
                </ul>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Mes rendez-vous
                </h2>
            }
        >
            <Head title="Mes rendez-vous" />

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

                    {card('À venir', upcoming, true)}
                    {card('Historique', history, false)}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
