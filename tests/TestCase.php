<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! $this->app->environment('testing')) {
            return;
        }

        if (config('database.default') === 'mysql') {
            throw new RuntimeException(
                'Feature tests must not run against MySQL. phpunit.xml sets DB_CONNECTION=sqlite and DB_DATABASE=:memory:. '.
                'If your IDE or runner ignores phpunit.xml, projects named P / P2 / POther from TemplateRecordFlowTest will accumulate in your dev database after each test run.'
            );
        }
    }
}
