# Demo accounts

These accounts live in the hosted dev project (`plar-dev`) and only see **synthetic** data. They're for testing and demos. Never reuse them anywhere that holds real student information.

**Password for every account: `demo1234`**

The quickest way in is the **Demo accounts** panel on `/sign-in`: one click signs you in. You can also type the email and password into the form.

| Who | Email | Role | Opens | What you'll see |
|---|---|---|---|---|
| Alex Morgan | `student@demo.test` | Student | Student workspace | Own case (feedback stage), 3 next steps, journey timeline |
| Sam Patel | `advisor@demo.test` | Advisor | Advisor workspace | 9 students, reviews, checklist and welcome-call tasks |
| Maria Laurent | `advisor2@demo.test` | Advisor | Advisor workspace | 7 students, a different caseload |
| Jordan Rivera | `assessor@demo.test` | Assessor | Assessor workspace | Chair on 4 cases, writer on 2, interviews this week |
| Kai Thompson | `writer@demo.test` | Assessor | Assessor workspace | Writer on 4 cases, chair on 2 |
| Dana Whitfield | `coordinator@demo.test` | Coordinator | PLAR office workspace | Every case, interview reminders |
| Lee Chen | `manager@demo.test` | Manager | PLAR office workspace | Every case, approvals and assessor assignment |
| Pat Okafor | `director@demo.test` | Director | PLAR office workspace | Every case, the final decision on M. Wong |
| Robin Admin | `admin@demo.test` | Administrator | PLAR office workspace | Every case and every profile |

The demo data also includes 15 more synthetic students (`…@students.demo.test`) who can't sign in, 16 cases across every stage, 70 journey events, 20 tasks and 4 interviews. Dates are relative to the day the seed was loaded.

## Resetting the demo data

The seed clears the previous demo data and loads it fresh. Ticked tasks go back to their original state.

```bash
cd harness
npm run dev:seed   # needs PLAR_DEV_DB_URL in harness/.env.local (Supabase dashboard → Connect → Session pooler)
npm run check      # confirms every account sees exactly what it should
```
