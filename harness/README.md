# Supabase harness

Scripts to configure and test the PLAR Supabase backend. They work against two **targets**:

| Target | What it is | Data |
|---|---|---|
| `dev` (default) | Hosted project `plar-dev` (`dxnurogvpdxtbaocallr`), Canada (Central), free plan | Migrations only. No accounts yet |
| `local` | The Supabase CLI stack on this machine (Docker), ports 544xx | Synthetic demo accounts from `supabase/seed.sql` |

The database itself lives in [`../supabase/`](../supabase): `config.toml`, `migrations/`, `seed.sql` and `tests/database/`.

## First run

```bash
cd harness
npm install
cp .env.example .env.local   # then fill in the dev publishable key (public by design)
npm run doctor               # checks tools, config and both targets
npm run check                # API and security checks against hosted dev
```

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | Checks Node, the Supabase CLI, Docker, env files, the CLI login and both targets |
| `npm run check` / `check:local` | API checks: reachability, signed-out access denied, and (local only) what each demo role can read and change |
| `npm run types` / `types:local` | Regenerates `web/src/lib/supabase/database.types.ts` |
| `npm run local:start` / `local:stop` / `local:status` | Runs the local stack |
| `npm run local:env` | Prints the local URL and publishable key in `web/.env.local` format |
| `npm run local:reset` | Rebuilds the local database from the migrations and the seed |
| `npm run test:db` | Runs the pgTAP tests in `supabase/tests/database` on the local stack |
| `npm run test` | `test:db`, then `check:local` |
| `npm run db:new <name>` | Creates a new migration file |
| `npm run db:lint` | Lints the local database schema |
| `npm run dev:link` | Links the CLI to the hosted dev project (once, after `supabase login`) |
| `npm run dev:migrations` | Compares local and hosted migrations |
| `npm run dev:push` | Applies new migrations to hosted dev |

## How a schema change flows

1. `npm run db:new add_cases`, then write the SQL in `supabase/migrations/`.
2. Add or extend a test in `supabase/tests/database/`.
3. Locally: `npm run local:reset`, then `npm run test`.
4. Hosted: `npm run dev:push`, then `npm run check` and `npm run types`.
5. Commit the migration, the test and the regenerated types together.

## Rules

- **Synthetic data only.** Demo accounts use `@example.test` addresses and exist only on the local stack. Never seed hosted projects with demo passwords.
- **No secrets in git.** `.env.local` files are git-ignored. The web app gets the publishable key only. Secret and service keys stay out of `web/`.
- **Every table has row-level security on**, with access denied unless a policy allows it. Each new table gets a pgTAP test for each role.
- Never run `local:reset` or `db reset` against a hosted project.

## Known issue: Colima port forwarding

This Mac runs Docker through Colima. If `local:start` fails with "connection refused" on port 54422, Colima isn't forwarding the new ports. `colima restart` fixes it, but it briefly stops any other running local stacks. Until then, use the `dev` target.
