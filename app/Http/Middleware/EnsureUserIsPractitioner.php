<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsPractitioner
{
    /**
     * Laisse passer uniquement les praticiens ; sinon renvoie une 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isPractitioner()) {
            abort(403, 'Cet espace est réservé aux praticiens.');
        }

        return $next($request);
    }
}
