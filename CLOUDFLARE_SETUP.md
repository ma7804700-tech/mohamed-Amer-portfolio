# Cloudflare Pages setup

Project links are public through a Cloudflare Pages Function and stored in D1. The admin password is a server-side secret; it is never included in the frontend bundle.

## Create and bind the free D1 database

1. Install dependencies and sign in to Cloudflare:

   ```powershell
   npm install
   npx wrangler login
   ```

2. Create the database:

   ```powershell
   npx wrangler d1 create mohamed-amer-projects
   ```

   Copy the returned database ID into `database_id` in `wrangler.toml`.

3. Create the tables:

   ```powershell
   npx wrangler d1 execute mohamed-amer-projects --remote --file=./schema.sql
   ```

   Existing installations that already created the original `projects` and `login_attempts` tables should also apply the additive project-controls migration:

   ```powershell
   npx wrangler d1 execute mohamed-amer-projects --remote --file=./migrations/0002_project_controls.sql
   ```

   Existing installations should also apply the website settings and admin password migration if they have not already been applied:

   ```powershell
   npx wrangler d1 execute mohamed-amer-projects --remote --file=./migrations/0003_site_content.sql
   npx wrangler d1 execute mohamed-amer-projects --remote --file=./migrations/0005_admin_password_changes.sql
   ```

4. Create the Pages project once, if it does not exist:

   ```powershell
   npx wrangler pages project create mohamed-amer-portfolio
   ```

5. Set the admin password as an encrypted Cloudflare secret. Enter `1397` when prompted if keeping the requested password; a longer unique password is strongly recommended because a four-digit PIN is weak, even with login throttling.

   ```powershell
   npx wrangler pages secret put ADMIN_PASSWORD --project-name mohamed-amer-portfolio
   ```

6. Generate a separate random signing secret and add it as a second encrypted secret:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   npx wrangler pages secret put ADMIN_SESSION_SECRET --project-name mohamed-amer-portfolio
   ```

   Paste the generated value at the prompt. Do not use the admin password as the signing secret.

7. Build and deploy:

   ```powershell
   npm run cf:deploy
   ```

The D1 binding in `wrangler.toml` makes the same database available to the Pages Functions in production. Do not commit an actual password or database credentials.

After logging in to the website administration panel, use the **Change password** tab to update the admin password. The current password is required; the new password must be at least 12 characters. Changing it signs out the current admin session, so sign in again with the new password.

## Local Pages Functions

Copy `.dev.vars.example` to `.dev.vars`, replace the example admin password and signing secret, then run:

```powershell
npx wrangler d1 execute mohamed-amer-projects --local --file=./schema.sql
npx wrangler d1 execute mohamed-amer-projects --local --file=./migrations/0002_project_controls.sql
npx wrangler d1 execute mohamed-amer-projects --local --file=./migrations/0003_site_content.sql
npx wrangler d1 execute mohamed-amer-projects --local --file=./migrations/0005_admin_password_changes.sql
npm run build
npm run cf:dev
```

Open the local Pages URL printed by Wrangler. `.dev.vars` and Wrangler's local state are git-ignored.
