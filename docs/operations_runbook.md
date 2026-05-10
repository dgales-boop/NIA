# Operations Runbook

## Before Release

1. Backup database.
2. Run migrations.
3. Run `php artisan db:seed` if demo users are required (`DemoUserSeeder` only; no field-type seeding).
4. Run tests and build.

## Rollback

1. Restore database backup.
2. Roll back latest deployment.
3. Re-verify app health routes.

## Support Checklist

- Confirm API availability.
- Confirm template retrieval.
- Confirm record write path.
- Check logs for validation errors.
