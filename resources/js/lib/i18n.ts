import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

type Replacements = Record<string, string | number>;

/**
 * Hook de traduction : renvoie une fonction t('groupe.clé', { param }).
 * Les traductions sont partagées par Inertia depuis lang/{locale}.json.
 */
export function useTranslations() {
    const { translations } = usePage<PageProps>().props;

    return (key: string, replacements: Replacements = {}): string => {
        const value = key.split('.').reduce<unknown>(
            (acc, part) =>
                acc && typeof acc === 'object'
                    ? (acc as Record<string, unknown>)[part]
                    : undefined,
            translations,
        );

        if (typeof value !== 'string') {
            return key; // fallback : on affiche la clé si la traduction manque
        }

        return Object.entries(replacements).reduce(
            (str, [k, v]) => str.replaceAll(`:${k}`, String(v)),
            value,
        );
    };
}
