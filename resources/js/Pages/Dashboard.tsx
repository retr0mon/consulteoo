import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslations } from '@/lib/i18n';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    const t = useTranslations();

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {t('dashboard.title')}
                </h2>
            }
        >
            <Head title={t('dashboard.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {t('dashboard.logged_in')}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
