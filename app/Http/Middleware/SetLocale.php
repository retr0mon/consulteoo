<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Applique la langue choisie (en session), français par défaut.
     */
    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale(session('locale', 'fr'));

        return $next($request);
    }
}
