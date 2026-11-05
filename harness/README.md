# Supabase harness

Scripts to configure and test the PLAR Supabase backend. **The project uses one cloud database for everything:** the hosted dev project `plar-dev` (`dxnurogvpdxtbaocallr`), Canada (Central), free plan. There's no staging project. The local Docker stack is optional and not needed.

The database itself is described in [`../supabase/`](../supabase): `migrations/` (schema), `seed.sql` (synthetic demo data) and `tests/database/` (pgTAP tests).

Demo sign-ins: [DEMO-ACCOUNTS.md](DEMO-ACCOUNTS.md).

## First run

```bash
cd harness
npm install
cp .env.example .env.local   # then fill in the dev publishable key (public by design)
npm run doctor               # checks tools, config and the dev project
npm run check                # signs in as every demo account and checks what each one can see and change
```

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | Checks Node, the Supabase CLI, env files, the CLI login and the dev project |
| `npm run check` | Reachability, signed-out access denied on every table, each demo account's cases and tasks, and what people can and can't change |
| `npm run dev:seed` | Reloads the synthetic demo data (needs `PLAR_DEV_DB_URL` and `psql`) |
| `npm run types` | Regenerates `web/src/lib/supabase/database.types.ts` from dev (after `supabase login`) |
| `npm run dev:link` | Links the CLI to the dev project (once, after `supabase login`) |
| `npm run dev:migrations` | Compares local migration files with what's applied on dev |
| `npm run dev:push` | Applies new migration files to dev |
| `npm run db:new <name>` | Creates a new migration file |

Optional local stack (Docker): `local:start`, `local:stop`, `local:reset`, `test:db`, `check:local`, `types:local`.

## How a schema change flows

1. `npm run db:new add_sections`, then write the SQL in `supabase/migrations/`.
2. `npm run dev:push` to apply it to dev. Claude can also apply it through the Supabase connector, keeping the same file and version.
3. Add the new expectations to `src/check.ts`, then `npm run check`.
4. `npm run types`, then commit the migration, the checks and the regenerated types together.

## Rules

- **Synthetic data only.** Every person in the dev project is made up (`@demo.test` addresses). Demo accounts share a simple password because they only ever see synthetic data. Before any real student information arrives, the demo accounts are removed and real sign-in takes over.
- **No secrets in git.** `.env.local` files are git-ignored. The web app gets the publishable key only. Secret keys and the database URL stay out of `web/`.
- **Every table has row-level security on**, and access is denied unless a policy allows it. Each new table gets checks for each role in `src/check.ts`.
