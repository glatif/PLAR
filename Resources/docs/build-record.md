# PLAR platform: build record

What was built, and when. Dates and times are Pacific time. Each **Commit** is a saved version in the GitHub repository (glatif/PLAR). Rows marked *Project log* come from the project's decision log, because that work happened before it was committed.

**As of Thursday 19 November 2026:** the platform is live at https://plar.airl.ca. Every commit uses synthetic data only.

## Record

| Date | What was done | Details | Evidence |
|---|---|---|---|
| **Thu 22 Oct 2026** | Project documentation | Read the department's PLAR materials and wrote them up as project documentation: overview, terminology, portfolio structure, competencies and credit, the end-to-end and assessment workflows, advising and feedback, communications and records, roles and permissions, principles, scope, automation opportunities, the technical approach and the open questions for the stakeholders. First draft of the feature list. | Project log |
| | Ground rules agreed | Built-in interview room first, with Zoom as the fallback. No commitment to an AI provider. Any AI service must not train on our data. ID checks are AI-assisted, and a person always decides. Facts, assumptions and proposals are kept apart. | Project log |
| **Thu 29 Oct 2026** | Feature list approved; build starts | Implementation plan written. Feature list and design system sent out as styled PDFs. | Project log |
| | Web app foundation (13:10) | Next.js app with the first design tokens, the home page, a sign-in placeholder and preview workspaces for each role, all with synthetic data. Confidential source documents kept out of version control. | Commit `daf6b8b` |
| | Light theme only (13:11) | The app stays light even when a device is set to dark mode. | Commit `39c7722` |
| **Fri 30 Oct 2026** | New design system (14:54) | Geist and Lora type, a tangerine accent on warm neutrals, outline icons plus a filled icon set. Interactive design system page added, and the whole app restyled to match. | Commit `f38f077` |
| **Sat 31 Oct 2026** | Backend and delivery window agreed | Supabase in Canada (Central) for the database and sign-in. The app runs on our own server with a proper domain. Delivery window set: **1 Nov 2026 to 28 Feb 2027** (17 weeks). | Project log |
| **Thu 5 Nov 2026** | 17-week build timeline (14:32) | Interactive week-by-week plan: overview chart, demos, dependencies, tasks, sub-tasks you can tick, and feedback for each week. | Commit `4e3a152` |
| | Database set up (15:08) | Cloud database `plar-dev` in Canada (Central). Foundation tables for profiles and roles, with row-level security so each person sees only what their role allows. Automated database tests, and a test harness that checks the setup. | Commit `343972c` |
| | Sign-in and live workspaces (16:43) | Tables for programs, cases, assessor pairs, journey events, tasks and interviews, each with per-role access rules. Email-and-password sign-in, one-click demo accounts (one per role), and live workspaces for each role. Synthetic data: 9 demo accounts, 15 more students and 16 cases. 19 automated sign-in checks. | Commit `d4fabf9` |
| **Wed 11 Nov 2026** | Identity verification lab built | `/verify`: face photo with a live oval guide, a short head-movement video, and photos of the ID front and back with live card detection. Reviewer page added. AI check approved for the lab only. | Project log |
| **Thu 12 Nov 2026** | Identity verification lab finished (14:08) | ID photos straightened automatically, including cards held in a hand with fingers over the edges. AI check: a face-match percentage, plus the details it reads from the ID. **Identity checks** page redesigned: search by name, filter by decision, sort, one collapsible row per student, a Verified / Not verified button you can undo, and single or bulk delete. Automated detection tests. | Commit `fa1ddb5` |
| | Code on GitHub | Repository pushed to GitHub (glatif/PLAR). Project files only: confidential material and photos stay off it. | GitHub |
| | First server deployment | Deployed to the shared Ubuntu server as a first live copy, with the lab switched off. | Project log |
| **Fri 13 Nov 2026** | Moved to the team's project server | Live at **https://plar.airl.ca** with HTTPS, deployed the same way as the team's other projects. The earlier copy was removed. | Project log |
| | Lab live, with links on the home page (09:52) | **Verify identity** and **Identity checks** buttons on the home page. The lab is switched on at plar.airl.ca and open without sign-in for now. Photos persist across updates. One-step deploy and health-check scripts. A full live test passed, and the test run was deleted. | Commit `f442435` |
| **Thu 19 Nov 2026** | Six roles (10:50) | Roles set to six for now: Student, Advisor (advisors also book interviews), Assessor, PLAR Manager, PLAR Director and Admin. Database rebuilt around them, with access rules for each and automated tests that sign in as every role. Each role has its own workspace. 8 demo accounts, synthetic only. | Commit `dc52a50` |
| | Sign in with Microsoft (demo) | A "Sign in with Microsoft" button that opens a picker of the demo accounts. The connection to TRU's Microsoft sign-in is prepared, to switch on once TRU IT sets it up. | Commit `dc52a50` |
| | Roles and access page | Admin page showing each role's purpose, duties and access, a table of what each role can do, the other TRU offices involved and what's still to confirm. | Commit `dc52a50` |
| | Demo sign-in live | Demo accounts and the Microsoft demo switched on at plar.airl.ca, using the cloud database. | Deployed |
| | Identity check test in the admin panel (10:55) | The admin panel links straight to the identity check test and the results page, for manual testing. | Commit `28663e0` |
| | PLAR's own Supabase on the server | Each project now has its own Supabase. PLAR's runs on the team's server, separate from Living Heritage's, with sign-up switched off and a nightly backup. Database structure, demo data and all tests loaded and passing there. | Commits `bba6486`, `a02a7d4` |
| | People management for admins | From the admin portal: add people with their roles, promote or change roles, reset passwords, deactivate and reactivate, sign people out everywhere, edit details and delete people with no records. Every change is recorded. New and reset accounts choose their own password at first sign-in. | Commit `eeb2d84` |
| | Microsoft sign-in ready for TRU | Everything on PLAR's side is ready for TRU Microsoft accounts: limited to TRU's own accounts, only people added by an admin can get in, clear messages when refused. Tested up to Microsoft's sign-in page. A new admin page lists what TRU IT needs to provide and the next steps for TRU Moodle. | Commit `855cf42` |
| | Live site on PLAR's own Supabase | With the new address in place (added by Dr. Latif), the live site now uses PLAR's own database on the team's server, over HTTPS. Everything tested live. | Deployed |
| | Identity checks protected | Photos, videos and ID details are now stored in PLAR's own database storage on the team's server, encrypted. The identity checks list shows only names and the AI's match percentage; everything else needs a password. Tested end to end on the live site. | Commit `61f911e` |
| | Manual captures no longer flagged | A photo taken with the button counts the same as an automatic one: no "to check" count or "Manual" label. Only real problems are flagged (an unfinished head movement, or ID corners not found). | Commit `d6475b1` |

## Thursday 19 November 2026 in brief

- **Six roles.** The database was rebuilt around Student, Advisor (who also books interviews), Assessor, PLAR Manager, PLAR Director and Admin, each with its own workspace and access rules, and automated tests that sign in as every role.
- **Roles and access page.** A page in the admin panel, ready to show stakeholders, sets out each role's purpose, duties and permissions, and what still needs confirming.
- **People management.** Admins add people, promote them, reset passwords, deactivate, sign out everywhere and delete, all from the portal and all recorded. New and reset accounts must choose their own password.
- **Microsoft sign-in, ready for TRU.** A demo is live, and the real TRU Microsoft sign-in is tested up to Microsoft's own page and waits only on TRU IT. An admin page sets out what TRU IT needs and the next steps for Moodle.
- **PLAR's own Supabase on the team server.** PLAR's database now runs separately from Living Heritage's, with sign-up off, HTTPS at `plar-api.airl.ca` and the live site switched over.
- **Encrypted identity checks.** Photos, videos and ID details are stored encrypted in a private bucket only the lab can open. The list shows names and AI match percentages, and everything else needs the password.
- **Storage set up on the server.** File storage was added to PLAR's Supabase, with a new private bucket for identity checks and a key that opens only that bucket. The encryption and storage keys were created on the server and never leave it. The existing live capture was moved in, verified and its plain copy removed.
- **The full pipeline, checked live.** Capture, straightening, AI matching and review all work against the new storage, tested end to end with synthetic images.
- **Backups and health checks.** Nightly backups cover the database and the stored files, and the health check now covers the new containers, HTTPS and backups.
- **Admin panel shortcuts.** One-click buttons open the identity-check test and the results page for manual testing, and the "to check" flags for manual captures are gone.
- **WellnessHub live on the team server.** The WellnessHub app was deployed alongside the other projects at https://wellness.airl.ca, the same way they're set up, and its AI key was moved off the public page onto the server. That fix is on its own branch on GitHub, waiting for a pull request.
- **Every change pushed and deployed.** All of today's PLAR work is on GitHub and live, with the docs and this record kept up to date throughout.

## Still to do

- **Off-server copy of the backups**, and a safe copy of the captures' encryption key.
- **Sign-in for the lab.** `/verify` and `/testing` are open to anyone with the link until sign-in is added.
- **Privacy note** for the start of the ID check (wording to come).
- **TRU Microsoft sign-in**, to replace the demo once TRU IT sets it up.
