import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { enGB, fr, type Locale } from 'date-fns/locale';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
};

/**
 * Hook de formatage : les dates/heures et le calendrier suivent la langue
 * courante (prop Inertia `locale`, 'fr' ou 'en'). Le fuseau reste Europe/Paris.
 */
export function useFormats() {
    const { locale } = usePage<PageProps>().props;
    const isEnglish = locale === 'en';

    const intlLocale = isEnglish ? 'en-GB' : 'fr-FR';
    const dateFmt = new Intl.DateTimeFormat(intlLocale, DATE_OPTIONS);
    const timeFmt = new Intl.DateTimeFormat(intlLocale, TIME_OPTIONS);

    const formatDate = (value: string | Date): string =>
        dateFmt.format(value instanceof Date ? value : new Date(value));

    const formatTime = (value: string | Date): string =>
        timeFmt.format(value instanceof Date ? value : new Date(value));

    const dateFnsLocale: Locale = isEnglish ? enGB : fr;

    return { formatDate, formatTime, dateFnsLocale };
}
