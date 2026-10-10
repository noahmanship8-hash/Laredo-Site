# Laredo Roleplay website

A complete website you can host for free. It has Home, Departments, Applications, Announcements, Shop, Rules and Staff pages, a Normal / Halloween mode switch, and an announcements page that fills itself from your Discord.

## What is in this folder

| File | What it is |
| --- | --- |
| `index.html` | The whole website. Edit text here. |
| `styles.css`, `site.js`, `config.js` | Look, behaviour and settings. |
| `assets/logo.png` | Your logo. |
| `announcements.json` | The announcements the site shows. The bot keeps this up to date. |
| `scripts/fetch-announcements.mjs` | Reads your Discord announcements channel. |
| `.github/workflows/update-announcements.yml` | Runs that script every 10 minutes for free. |

## Part 1: Put the site online (about 5 minutes)

1. Unzip the download. Open the unzipped folder and check that you can see `index.html` straight away.
2. Go to **app.netlify.com/drop** and drag the **whole unzipped folder** onto the page.
3. Netlify gives you a link. Open it. Your site is live.

If Netlify says "Page not found":
- Upload the whole folder, not just `index.html`. The page also needs `styles.css`, `site.js` and the `assets` folder.
- `index.html` must be at the top of what you upload. If you dragged a folder that only contains another folder, Netlify has no front page.
- Do not upload the page you edit inside Claude. That copy loads its pictures and scripts from Claude's servers, so it breaks anywhere else.

At this point the Announcements page shows "No announcements yet". Part 2 switches the live feed on.

## Part 2: Live announcements from Discord

The announcements page updates itself within about 10 to 15 minutes of a new post. Nothing needs to stay switched on.

### A. Create the bot
1. Go to **discord.com/developers/applications**, click **New Application**, and name it.
2. Open the **Bot** tab and click **Reset Token**. Copy the token and keep it private.
3. On the same page, under **Privileged Gateway Intents**, turn on **Message Content Intent** and save. Without this, posts arrive empty.
4. Open **OAuth2 > URL Generator**. Tick **bot**, then tick **View Channels** and **Read Message History**. Open the link it gives you and add the bot to your server.
5. If your announcements channel is private, give the bot **View Channel** and **Read Message History** there (channel settings > Permissions).

### B. Copy the channel ID
In Discord, go to **Settings > Advanced** and turn on **Developer Mode**. Right-click your announcements channel and choose **Copy Channel ID**.

### C. Put the files on GitHub
1. Create a free account at github.com and click **New repository**. Name it `laredo-site` and make it **Public**.
2. Click **uploading an existing file** and drag in everything from the unzipped folder.
3. Check that the `.github` folder is there. It starts with a dot, so some computers hide it. If it did not upload, click **Add file > Create new file**, type `.github/workflows/update-announcements.yml` as the name, and paste the text from the bottom of this guide.

### D. Add your two secrets
In the repository, open **Settings > Secrets and variables > Actions > New repository secret** and add:
- `DISCORD_BOT_TOKEN` with the token from step A2
- `ANNOUNCEMENTS_CHANNEL_ID` with the channel ID from step B

Never paste the token into any file or chat. If it ever leaks, reset it in the Developer Portal.

### E. Run it once
Open the **Actions** tab, choose **Update announcements**, and click **Run workflow**. If GitHub asks you to enable Actions, do that first. A green tick means it worked, and `announcements.json` now holds your latest posts.

### F. Make the site update by itself
Your Part 1 site was a manual upload, so it will not notice new commits. Connect it to GitHub instead:
- **Netlify:** Add new site > Import an existing project > GitHub > pick `laredo-site`. Leave the build command empty and the publish directory as the main folder, then Deploy.
- **Cloudflare Pages:** works the same way (Workers & Pages > Create > Pages > Connect to Git, no build command).

From then on, every new announcement updates the site on its own.

## Changing things

Open `index.html` in a text editor (Notepad works) and use Find.
- **Prices:** search for `Robux`.
- **Discord link:** search for `discord.gg`.
- **Turn on a department or application:** find its card, then replace the grey button with a real link:

```html
<a class="btn-gold" href="PASTE-LINK-HERE" target="_blank" rel="noopener noreferrer">Join the Discord</a>
```

You can also change its "Coming soon" label to `<span class="pill pill-open"><span class="pd"></span>Discord open</span>`. Or send the link to Claude and ask for an updated file.

## If something goes wrong

- **Red cross in Actions:** open the run and read the message. `401` means the token is wrong. `403` or "Missing Access" means the bot cannot see the channel. `404` means the channel ID is wrong or the bot is in a different server.
- **Posts show up with no text:** Message Content Intent (step A3) is off.
- **"Save changes" fails with a permissions error:** in the repository go to Settings > Actions > General > Workflow permissions, and choose **Read and write permissions**.
- **Announcements page says it could not load:** you opened `index.html` by double-clicking it. Use the Netlify link, because the page needs a web host.
- **Updates stopped after a long quiet spell:** GitHub pauses scheduled runs after about 60 days of no activity. Open the Actions tab and click Enable.
- **Pictures in posts are not shown.** Discord picture links expire. The post says it has attachments and links to Discord.

## The workflow file (for step C3)

```yaml
name: Update announcements

on:
  schedule:
    - cron: "*/10 * * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: update-announcements
  cancel-in-progress: false

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Fetch announcements from Discord
        env:
          DISCORD_BOT_TOKEN: ${{ secrets.DISCORD_BOT_TOKEN }}
          ANNOUNCEMENTS_CHANNEL_ID: ${{ secrets.ANNOUNCEMENTS_CHANNEL_ID }}
        run: node scripts/fetch-announcements.mjs

      - name: Save changes
        run: |
          if git diff --quiet -- announcements.json; then
            echo "No new announcements."
          else
            git config user.name "laredo-announcements-bot"
            git config user.email "actions@users.noreply.github.com"
            git add announcements.json
            git commit -m "Update announcements"
            git push
          fi
```
