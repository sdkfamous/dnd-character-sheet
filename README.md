# D&D 5e Character Sheet

A modern, interactive character sheet for D&D 5th Edition (2024 rules) with Google Drive cloud storage.

## Features

- ✨ Interactive character sheet compliant with D&D 2024 rules
- ☁️ Google Drive cloud storage (each user uses their own Drive)
- 📊 Ability score breakdown (Base + Species + ASI + Feat + Magic)
- 🎲 Dynamic lists for skills, weapons, spells
- 📏 Resizable sections with layout persistence
- ↩️ Undo/Redo functionality
- 📱 Mobile responsive with collapsible sections
- 🔒 TypeScript for type safety

## Quick Start (Local Development)

1. **Install dependencies:**
```bash
npm install
```

2. **Build TypeScript:**
```bash
npm run build
```

3. **Start local server:**
```bash
npm run serve
```

4. Open http://localhost:8000 in your browser

### Development Workflow

- **Watch mode** (auto-compile on changes):
```bash
npm run watch
```

- Edit TypeScript files in `src/`
- Refresh browser to see changes

## Deployment to GitHub Pages

### Initial Setup

1. **Create a GitHub repository**

2. **Push your code:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be auto-created)
   - Save

4. **GitHub Actions will automatically:**
   - Compile TypeScript on every push
   - Deploy to GitHub Pages
   - Site will be at: `https://<username>.github.io/<repo-name>/`

## Google Drive Cloud Storage Setup

To enable cloud storage where **each user saves to their own Google Drive**:

### Step 1: Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "D&D Character Sheet Drive API"

### Step 2: Enable Google Drive API Service

1. In Apps Script editor, click "Services" (left sidebar, puzzle piece icon)
2. Click "+ Add a service"
3. Find "Drive API" and click "Add"

### Step 3: Add Backend Code

1. Delete the default `Code.gs` content
2. Copy the entire contents of `apps-script/Code.gs` from this repository
3. Paste into Apps Script editor
4. Save (Ctrl+S / Cmd+S)

### Step 4: Deploy as Web App

⚠️ **IMPORTANT: This step determines security!**

1. Click "Deploy" → "New deployment"
2. Click gear icon (⚙️) → "Web app"
3. Configure deployment settings:
   - **Description**: "Character Sheet Drive API v1"
   - **Execute as**: **"User accessing the web app"** ⚠️ (NOT "Me")
   - **Who has access**: **"Anyone with a Google account"**
4. Click "Deploy"
5. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/...../exec`)

**What do these settings mean?**

| Setting | Option | What it does |
|---------|--------|--------------|
| **Execute as** | "Me" ❌ | BAD - Everyone uses YOUR Drive (security issue!) |
| **Execute as** | "User accessing the web app" ✅ | GOOD - Each user uses their own Drive |
| **Who has access** | "Only myself" | Only you can use it (not even on other devices) |
| **Who has access** | "Anyone with a Google account" ✅ | Anyone can use it with their Google account |

**For your use case (you + friends):**
- Execute as: **"User accessing the web app"**
- Who has access: **"Anyone with a Google account"**

### Step 5: Update Frontend

1. Open `src/character-sheet.ts`
2. Find: `private readonly APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';`
3. Replace with your Web App URL:
```typescript
private readonly APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```
4. Save and rebuild:
```bash
npm run build
```

### Step 6: Test & First-Time Authentication

1. Open the character sheet
2. Click "Save" or "Load" button
3. **First time only**: You'll be prompted to:
   - Sign in with Google
   - See "Google hasn't verified this app" warning
   - Click "Advanced" → "Go to [app name] (unsafe)"
   - Grant permission to access your Drive
4. After authorization, it will work seamlessly

**Each browser/device needs to authenticate once.**

### For Friends/Other Users

When sharing with friends:
- Give them the GitHub Pages URL
- They'll go through the same authentication on their first use
- They'll see the "unverified app" warning (explain they can trust it)
- Their data saves to **their own** Google Drive, not yours

## Updating the Apps Script

If you need to update `Code.gs`:

1. Make changes in Apps Script editor
2. Save
3. Deploy → "Manage deployments"
4. Click pencil icon on current deployment
5. Click "Version" → "New version"
6. Click "Deploy"
7. URL stays the same (no frontend changes needed)

## Troubleshooting

### "Google Drive not configured" error
- Check `APPS_SCRIPT_URL` is set in `src/character-sheet.ts`
- Rebuild: `npm run build`

### "Failed to save/load" errors
- Check Apps Script deployment settings
- Verify "Execute as: User accessing the web app"
- Verify "Who has access: Anyone"

### Authentication issues
- Clear browser cache/cookies
- Re-authorize the app
- Check that Apps Script project has Drive API service enabled

### Files not appearing in modal
- Files must have `.json` extension
- Files must be created by the app (due to Drive API scope)

## Security & Privacy

✅ **Each user's data is isolated:**
- Users authenticate with their own Google account
- Files are stored in each user's own Google Drive
- One user cannot access another user's files

✅ **Limited Drive access:**
- App can only access files it creates
- Cannot see or modify other Drive files
- Uses `drive.file` scope (most restrictive)

⚠️ **"Unverified app" warning:**
- Apps Script projects show this unless verified by Google
- Safe to ignore for personal/friend use
- Google verification requires business/organizational use case

## Project Structure

```
├── src/                          # TypeScript source
│   ├── character-sheet.ts        # Main character sheet logic
│   └── google-drive-manager.ts   # Google Drive API client
├── apps-script/                  # Google Apps Script backend
│   └── Code.gs                   # Backend code (deploy to script.google.com)
├── dist/                         # Compiled JavaScript (generated)
│   └── character-sheet.js
├── css/                          # Stylesheets
│   └── styles.css
├── index.html                    # Main HTML
├── tsconfig.json                 # TypeScript config
├── package.json                  # npm config
└── .github/
    └── workflows/
        └── build.yml             # GitHub Actions auto-deploy
```

## How It Works

1. **Frontend** (runs in browser):
   - TypeScript → compiled to JavaScript
   - Handles UI, data model, user interactions
   - Communicates with Google Apps Script backend

2. **Backend** (Google Apps Script):
   - Acts as proxy to Google Drive API
   - Handles authentication & permissions
   - Performs CRUD operations on Drive files

3. **Storage** (Google Drive):
   - Each user's files stored in their own Drive
   - Files use `.json` format with character data + layout

## License

MIT
