# Database backups

The free Supabase plan has no automatic backups, so
[`.github/workflows/backup.yml`](../.github/workflows/backup.yml) makes one every
night at 03:00 India time:

1. Copies the database with Supabase's own tool (`supabase db dump`): roles, schema and data,
   including the sign-in accounts (`auth.users`). Live sign-in sessions and one-time codes
   are left out, so after a restore everyone simply signs in again.
2. Encrypts the copy with a password only you know (AES-256, `gpg`).
3. Saves it on the workflow run as `ecorche-db-YYYY-MM-DD`, kept for **30 days**.
4. Makes one small request to the Supabase API, so the free project never pauses for being idle.

**This repository is public.** Anyone signed in to GitHub can download the saved file, which
is why it is encrypted first. Nothing is ever committed, and the run log only shows file
sizes and row counts.

GitHub emails you if a night's backup fails.

## One-time setup: two secrets

In GitHub: **shxrey/ECORCHE. → Settings → Secrets and variables → Actions →
New repository secret**. Create both:

| Name | Value |
| --- | --- |
| `SUPABASE_DB_URL` | Supabase dashboard → **Connect** → **Session pooler** connection string, with your database password in place of `[YOUR-PASSWORD]`. (Session pooler, not "Direct": GitHub's servers can't reach the direct address.) If you don't know the database password, reset it under **Project Settings → Database**. The website doesn't use it, so nothing breaks. |
| `BACKUP_PASSPHRASE` | A long password you make up, for example five random words. **Save it in your password manager.** Without it the backups can't be opened, by you or anyone else. |

Then **Actions → Nightly backup → Run workflow** to make the first one straight away.

## Restoring

You'd only need this if the database were lost or damaged. Restore into a **new**
Supabase project, then point the site at it.

1. **Actions → Nightly backup →** pick a successful night → download the
   `ecorche-db-YYYY-MM-DD` file under *Artifacts* and unzip it.
2. Decrypt it (asks for `BACKUP_PASSPHRASE`) and unpack:

   ```sh
   gpg -d ecorche-db-YYYY-MM-DD.tar.gz.gpg > backup.tar.gz
   tar -xzf backup.tar.gz   # roles.sql, schema.sql, data.sql
   ```

3. Load it into the new project, using its **Session pooler** connection string
   (Supabase's documented restore command):

   ```sh
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file roles.sql --file schema.sql \
     --command 'SET session_replication_role = replica' \
     --file data.sql \
     --dbname "postgresql://postgres.NEWREF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
   ```

4. Point the site at the new project. In Vercel, update `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. In the new Supabase project, set up again:
   the Site URL and Redirect URLs, custom SMTP (Resend), and the sign-in email template
   (`supabase/templates/login-email.html`). Update the URL and key in `backup.yml` too.

## Good to know

- GitHub turns off scheduled workflows in a repository that has had no commits for 60 days.
  If that happens: **Actions → Nightly backup → Enable workflow**.
- If you ever move to Supabase Pro, it makes daily backups itself and projects never pause,
  so this workflow can be deleted.
