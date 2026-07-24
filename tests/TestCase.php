<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Neutralise la directive @vite pendant les tests : les tests back
        // ne doivent pas dépendre du build front (assets compilés / serveur Vite).
        $this->withoutVite();
    }
}
