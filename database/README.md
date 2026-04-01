# Database Assets

This folder contains database artifacts for Aether Carbon.

## Included

- `dumps/carbon_tracker_full_*.dump` - full PostgreSQL custom-format dump (`pg_dump -Fc`)

## Restore Example

```bash
createdb -h localhost -p 5432 -U user carbon_tracker_restore
pg_restore -h localhost -p 5432 -U user -d carbon_tracker_restore --clean --if-exists dumps/carbon_tracker_full_<timestamp>.dump
```

## Notes

- Keep production credentials out of Git.
- For deployment, store secrets in GitHub repository secrets instead of tracked files.
