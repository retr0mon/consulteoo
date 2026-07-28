import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';

const LANGS = ['fr', 'en'] as const;

export default function LanguageSwitcher() {
    const { locale } = usePage<PageProps>().props;

    const switchTo = (lang: string) => {
        if (lang !== locale) {
            router.put(
                route('locale.update'),
                { locale: lang },
                { preserveScroll: true, preserveState: false },
            );
        }
    };

    return (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
            {LANGS.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    onClick={() => switchTo(lang)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition ${
                        locale === lang
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {lang}
                </button>
            ))}
        </div>
    );
}
