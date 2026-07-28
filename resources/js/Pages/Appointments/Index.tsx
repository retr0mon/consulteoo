import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useFormats } from '@/lib/format';
import { useTranslations } from '@/lib/i18n';
import { AppointmentRow, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

const STATUS: Record<
    AppointmentRow['status'],
    { labelKey: string; className: string }
> = {
    scheduled: {
        labelKey: 'appointments.status_scheduled',
        className: 'bg-indigo-50 text-indigo-700',
    },
    cancelled: {
        labelKey: 'appointments.status_cancelled',
        className: 'bg-red-50 text-red-700',
    },
    completed: {
        labelKey: 'appointments.status_completed',
        className: 'bg-emerald-50 text-emerald-700',
    },
};

export default function Index({
    appointments,
    mode,
}: {
    appointments: AppointmentRow[];
    mode: 'patient' | 'practitioner';
}) {
    const t = useTranslations();
    const { formatDate, formatTime } = useFormats();
    const { flash } = usePage<PageProps>().props;
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const now = Date.now();
    const isUpcoming = (a: AppointmentRow) =>
        a.status === 'scheduled' && new Date(a.starts_at).getTime() > now;

    const upcoming = appointments.filter(isUpcoming);
    const history = appointments.filter((a) => !isUpcoming(a));

    const partyLabel =
        mode === 'patient'
            ? t('appointments.practitioner')
            : t('appointments.patient');

    const cancel = (id: number) => {
        if (confirm(t('appointments.cancel_confirm'))) {
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
                    {formatDate(a.starts_at)}
                </p>
                <p className="text-sm text-gray-500">
                    {formatTime(a.starts_at)} – {formatTime(a.ends_at)} ·{' '}
                    {partyLabel} : {a.party}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[a.status].className}`}
                >
                    {t(STATUS[a.status].labelKey)}
                </span>
                {cancellable && mode === 'patient' && (
                    <button
                        type="button"
                        onClick={() => cancel(a.id)}
                        disabled={cancellingId === a.id}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                        {cancellingId === a.id
                            ? t('appointments.cancelling')
                            : t('appointments.cancel')}
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
                    {t('appointments.nothing')}
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
                    {t('appointments.title')}
                </h2>
            }
        >
            <Head title={t('appointments.title')} />

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

                    {card(t('appointments.upcoming'), upcoming, true)}
                    {card(t('appointments.history'), history, false)}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
