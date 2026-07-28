<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // Messages flash transmis à toutes les pages Inertia.
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            // Internationalisation : langue courante + dictionnaire.
            'locale' => app()->getLocale(),
            'translations' => $this->translations(),
        ];
    }

    /**
     * Charge le dictionnaire de la langue courante (lang/{locale}.json).
     *
     * @return array<string, mixed>
     */
    private function translations(): array
    {
        $path = base_path('lang/'.app()->getLocale().'.json');

        return File::exists($path) ? File::json($path) : [];
    }
}
