# Laredo Roleplay website, version 2

Sign in with Discord, a member dashboard, Roblox account linking, applications filled in on the site, a staff panel, and a settings page for Head of Staff, Executive, Leadership and Discord Developers. The look is flatter and plainer than before, with a Normal and a Halloween mode.

## What needs to be set up

The login, panel and applications need a small server part. That part runs free on **Netlify Functions**, so your site must be deployed from GitHub (not drag and drop). You already have a GitHub repository for the announcements, so you are most of the way there.

You will create or collect these things. Each step below says where.

| Thing | Needed for |
| --- | --- |
| Netlify site connected to your GitHub repository | Everything |
| Discord application (the one your bot is already in works) | Sign in with Discord and role checks |
| Bot token (you already have it) | Checking roles live |
| A random secret | Keeping logins safe |
| Roblox OAuth app | Linking Roblox accounts (optional) |
| A Discord webhook | A ping when someone applies (optional) |

## Step 1: Put the files on GitHub

1. Open your repository on github.com.
2. Click **Add file > Upload files** and drag in everything from this folder. Keep `announcements.json` and the `.github` folder as they are.
3. Check these new things are there: `netlify.toml`, `package.json` and the `netlify` folder.
4. Click **Commit changes**.

## Step 2: Connect Netlify to the repository

If your Netlify site was made by dragging a folder in, make a new one instead:
**Add new site > Import an existing project > GitHub >** pick your repository > leave the build command empty > **Deploy**.

If it is already connected to GitHub, it will rebuild by itself after step 1.

Copy your site address (for example `https://laredoroleplay.netlify.app`). You will need it below. It is called SITE ADDRESS in this guide.

## Step 3: Discord sign in

1. Go to **discord.com/developers/applications** and open the same application your announcements bot uses.
2. Open **OAuth2**. Under **Redirects**, add `SITE ADDRESS/api/auth/discord/callback` (for example `https://laredoroleplay.netlify.app/api/auth/discord/callback`). Save.
3. On the same page copy the **Client ID** and **Client Secret**.
4. Make sure the bot is in your server. It only reads roles, so it needs no special permissions.

## Step 4: Add the settings to Netlify

In Netlify open **Site configuration > Environment variables > Add a variable** and add these. Tick "Contains secret values" for the secrets.

| Name | Value |
| --- | --- |
| `SESSION_SECRET` | A long random string, 40 characters or more. A password generator works. |
| `DISCORD_CLIENT_ID` | From step 3 |
| `DISCORD_CLIENT_SECRET` | From step 3 |
| `DISCORD_BOT_TOKEN` | Your bot token (the same one the announcements use) |
| `ROBLOX_CLIENT_ID` | From step 5 (optional) |
| `ROBLOX_CLIENT_SECRET` | From step 5 (optional) |
| `APPLICATIONS_WEBHOOK_URL` | A Discord webhook link (optional): channel settings > Integrations > Webhooks. Staff get a message when someone applies or a decision is made. |

Then open **Deploys > Trigger deploy > Clear cache and deploy site**.

## Step 5: Roblox linking (optional, you can do it later)

1. Open **create.roblox.com** and go to **Creator Hub > OAuth 2.0 apps** (it may be under Credentials). Create an app.
2. Add the redirect `SITE ADDRESS/api/auth/roblox/callback`.
3. Choose the scopes **openid** and **profile**.
4. Copy the **Client ID**, generate a **Client Secret**, and add both to Netlify (step 4). Redeploy.

Roblox may only let a small number of people use a new app until it passes their review. If that happens, linking will fail for most members until Roblox approves it. Everything else on the site keeps working, and the dashboard says Roblox linking is not set up while the two Roblox variables are empty.

## Who can do what

These role IDs are already in the code:

| Role | ID | Access |
| --- | --- | --- |
| Staff Team | 1558228597402243153 | Opens the staff panel and reviews applications |
| Head of Staff | 1559256083292495962 | Staff panel plus Settings |
| Executive | 1558209179276017735 | Staff panel plus Settings |
| Leadership | 1558209177778913330 | Staff panel plus Settings |
| Discord Developer | 1558209180723060808 | Staff panel plus Settings |

Roles are checked against your server every time something private is opened, so removing a role removes access within about a minute. To change them later, add the Netlify variables `STAFF_ROLE_ID` (one ID) or `ADMIN_ROLE_IDS` (IDs separated by commas).

## What the staff panel does

- **Applications:** a list of everything people have sent. Open one to read the answers, see their linked Roblox account, then accept or deny it with an optional note. The applicant sees the result on their dashboard.
- **Settings** (Head of Staff, Executive, Leadership, Discord Developer):
  - Open or close each department and change its Discord invite.
  - Open or close each application.
  - A notice banner across the top of every page.
  - Maintenance mode. Visitors see a back-soon screen. Staff can still use the site. This is a cover over the site, not a lock on the files.
  - The default Normal or Halloween mode for new visitors.
  - Shop prices.

Changes are saved straight away and show for everyone on their next page load.

## Changing things yourself

- **Application questions:** edit `netlify/functions/forms.mjs`. The text there is what people see.
- **Photos:** put `hero.jpg` in `assets/photos/` and it shows beside the headline. Without it the logo is used.
- **Other text:** open `index.html` and use Find.
- **Announcements:** nothing to do. The GitHub workflow from before keeps filling `announcements.json`.

## If something goes wrong

| What you see | What to check |
| --- | --- |
| "Sign in is not set up on this site yet" | `SESSION_SECRET`, `DISCORD_CLIENT_ID` or `DISCORD_CLIENT_SECRET` is missing in Netlify. Redeploy after adding them. |
| Discord says "Invalid redirect" | The redirect in step 3 does not match your site address exactly. |
| "Could not check your Discord roles" | `DISCORD_BOT_TOKEN` is missing or wrong, or the bot is not in the server. If it still fails, turn on **Server Members Intent** on the bot's page. |
| Staff cannot open the panel | They need the Staff Team role in your server. Sign out and back in. |
| The dashboard says accounts are not switched on | The site is not deployed from GitHub with Functions. Check step 2. |
| Roblox sign in fails | Both Roblox variables are set, the redirect matches, and Roblox has approved the app. |

To check the server part is alive, open `SITE ADDRESS/api/health`. It should show `{"ok":true}`.

## Safety

- Keep tokens and secrets only in Netlify's environment variables. Never put them in a file or the repository.
- If a secret leaks, reset it (Discord Developer Portal or Roblox) and update Netlify.
- The site stores Discord and Roblox IDs, names and application answers in Netlify's built-in storage. The Privacy page explains this to members. Edit it if you change anything.

## Tests (optional)

`npm install` then `npm test` runs the checks that were used to build this. They use pretend Discord and Roblox servers, so they need no keys.
