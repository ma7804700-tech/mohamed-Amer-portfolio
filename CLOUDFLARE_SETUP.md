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

   Existing installations should also apply the website settings and WhatsApp recovery migrations if they have not already been applied:

   ```powershell
   npx wrangler d1 execute mohamed-amer-projects --remote --file=./migrations/0003_site_content.sql
   npx wrangler d1 execute mohamed-amer-projects --remote --file=./migrations/0004_admin_whatsapp_recovery.sql
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

7. Configure WhatsApp password recovery in the Cloudflare Pages dashboard under **Settings → Variables and Secrets**:

   - Add `WHATSAPP_ACCESS_TOKEN` as an encrypted secret. Never put this token in the website, GitHub, or a chat message.
   - Add `WHATSAPP_PHONE_NUMBER_ID` with the phone-number ID shown in the Meta WhatsApp app.
   - Add `WHATSAPP_RECOVERY_NUMBER` with the trusted recipient number in international format using digits only (no `+`).
   - Add `WHATSAPP_RECOVERY_TEMPLATE` with the name of an approved WhatsApp Utility template whose message body contains exactly one `{{1}}` parameter for the six-digit code.
   - Add `WHATSAPP_RECOVERY_LANGUAGE` using the exact language/locale of that approved template (for example, `ar` or `en_US`).
   - Add `WHATSAPP_GRAPH_API_VERSION` using a Graph API version currently supported by the Meta app (for example, `vXX.X`).

   Create these settings in the **Production** environment. Recovery codes expire after five minutes; sending is limited to three codes per hour globally and per client IP, with a one-minute cooldown. Codes are stored only as keyed hashes, accepted once, and protected by a five-attempt limit. Changing the password invalidates existing admin sessions.

8. Build and deploy:

   ```powershell
   npm run cf:deploy
   ```

The D1 binding in `wrangler.toml` makes the same database available to the Pages Functions in production. Do not commit an actual password or database credentials.

## Local Pages Functions

Copy `.dev.vars.example` to `.dev.vars`, replace both example values with a local admin password and a long random signing secret, then run:

```powershell
npx wrangler d1 execute mohamed-amer-projects --local --file=./schema.sql
npx wrangler d1 execute mohamed-amer-projects --local --file=./migrations/0002_project_controls.sql
npx wrangler d1 execute mohamed-amer-projects --local --file=./migrations/0003_site_content.sql
npx wrangler d1 execute mohamed-amer-projects --local --file=./migrations/0004_admin_whatsapp_recovery.sql
npm run build
npm run cf:dev
```

Open the local Pages URL printed by Wrangler. `.dev.vars` and Wrangler's local state are git-ignored.
