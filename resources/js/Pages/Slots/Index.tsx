import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Slot } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { fr } from 'date-fns/locale';
import { CSSProperties, FormEventHandler, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

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

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function toYmd(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Options d'heures : 08:00 → 19:45 par pas de 15 min.
const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 19; h++) {
    for (const m of ['00', '15', '30', '45']) {
        TIME_OPTIONS.push(`${pad(h)}:${m}`);
    }
}

const DURATIONS = [15, 30, 45, 60];

const WEEKDAYS = [
    { iso: 1, label: 'Lun' },
    { iso: 2, label: 'Mar' },
    { iso: 3, label: 'Mer' },
    { iso: 4, label: 'Jeu' },
    { iso: 5, label: 'Ven' },
    { iso: 6, label: 'Sam' },
    { iso: 7, label: 'Dim' },
];

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';

const calendarStyle = {
    '--rdp-accent-color': '#4f46e5',
    '--rdp-accent-background-color': '#eef2ff',
    '--rdp-day-height': '2.25rem',
    '--rdp-day-width': '2.25rem',
} as CSSProperties;

export default function Index({ slots }: { slots: Slot[] }) {
    const { flash } = usePage<PageProps>().props;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [range, setRange] = useState<DateRange | undefined>(undefined);

    const { data, setData, post, processing, errors, reset } = useForm({
        from_date: '',
        to_date: '',
        weekdays: [1, 2, 3, 4, 5] as number[],
        start_time: '09:00',
        end_time: '12:00',
        duration: 30,
    });

    useEffect(() => {
        setData('from_date', range?.from ? toYmd(range.from) : '');
        setData(
            'to_date',
            range?.to ? toYmd(range.to) : range?.from ? toYmd(range.from) : '',
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const toggleWeekday = (iso: number) => {
        setData(
            'weekdays',
            data.weekdays.includes(iso)
                ? data.weekdays.filter((d) => d !== iso)
                : [...data.weekdays, iso],
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('slots.batch'), {
            onSuccess: () => {
                reset();
                setRange(undefined);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Mes créneaux
                </h2>
            }
        >
            <Head title="Mes créneaux" />

            <div className="py-10">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5 flex-none"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {flash.success}
                        </div>
                    )}

                    {/* Génération de créneaux */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">
                            Générer des créneaux
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Choisissez une période, les jours, une plage horaire et une
                            durée.
                        </p>

                        <form onSubmit={submit} className="mt-5 sm:flex sm:gap-8">
                            <div className="flex justify-center" style={calendarStyle}>
                                <DayPicker
                                    mode="range"
                                    locale={fr}
                                    selected={range}
                                    onSelect={setRange}
                                    defaultMonth={today}
                                    disabled={{ before: today }}
                                    showOutsideDays
                                />
                            </div>

                            <div className="mt-6 flex-1 space-y-4 sm:mt-0">
                                <div>
                                    <InputLabel value="Jours de la semaine" />
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {WEEKDAYS.map((d) => {
                                            const active = data.weekdays.includes(d.iso);
                                            return (
                                                <button
                                                    type="button"
                                                    key={d.iso}
                                                    onClick={() => toggleWeekday(d.iso)}
                                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                                        active
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError
                                        message={errors.weekdays}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel htmlFor="start_time" value="De" />
                                        <select
                                            id="start_time"
                                            className={selectClass}
                                            value={data.start_time}
                                            onChange={(e) =>
                                                setData('start_time', e.target.value)
                                            }
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="end_time" value="À" />
                                        <select
                                            id="end_time"
                                            className={selectClass}
                                            value={data.end_time}
                                            onChange={(e) =>
                                                setData('end_time', e.target.value)
                                            }
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="duration" value="Durée" />
                                    <select
                                        id="duration"
                                        className={selectClass}
                                        value={data.duration}
                                        onChange={(e) =>
                                            setData('duration', Number(e.target.value))
                                        }
                                    >
                                        {DURATIONS.map((d) => (
                                            <option key={d} value={d}>
                                                {d} minutes
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <InputError message={errors.from_date} />
                                <InputError message={errors.to_date} />
                                <InputError message={errors.end_time} />

                                <button
                                    type="submit"
                                    disabled={processing || !range?.from}
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Génération…' : 'Générer les créneaux'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Liste des créneaux */}
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h3 className="text-base font-semibold text-gray-900">
                                Vos créneaux
                            </h3>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                {slots.length}
                            </span>
                        </div>

                        {slots.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <p className="text-sm font-medium text-gray-900">
                                    Aucun créneau
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Générez vos créneaux ci-dessus.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {slots.map((slot) => (
                                    <li
                                        key={slot.id}
                                        className="flex items-center justify-between px-6 py-4 text-sm transition hover:bg-gray-50"
                                    >
                                        <span className="font-medium capitalize text-gray-900">
                                            {dateFmt.format(new Date(slot.starts_at))}
                                        </span>
                                        <span className="text-gray-500">
                                            {timeFmt.format(new Date(slot.starts_at))} –{' '}
                                            {timeFmt.format(new Date(slot.ends_at))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
