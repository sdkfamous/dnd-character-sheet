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

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click project dropdown → "New Project"
3. Name: "D&D Character Sheet"
4. Click "Create"

### Step 2: Enable Google Drive API

1. In left sidebar: "APIs & Services" → "Library"
2. Search: "Google Drive API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Click "Get started"
3. Choose **"External"**
4. Fill in:
   - App name: D&D Character Sheet
   - User support email: Your email
   - Developer contact: Your email
5. Click through wizard
6. Add scope (if prompted):
   - Search: `drive.file`
   - Select: `.../auth/drive.file`

### Step 4: Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **"Web application"**
4. Name: "D&D Character Sheet Web"
5. **Authorized JavaScript origins:**
   - Add: `https://<your-username>.github.io`
   - Add: `http://localhost:8000`
6. Click "Create"
7. **Copy the Client ID**

### Step 5: Update the Code

1. Open `src/google-drive-manager.ts`
2. Find line: `private readonly CLIENT_ID = '924934734078-5qpia0pclmotj2dg2k628aejvbcfdbnl.apps.googleusercontent.com';`
3. Replace with your Client ID
4. Save and rebuild:
```bash
npm run build
```

### Step 6: Test

1. Push to GitHub (or test on localhost)
2. Open the app
3. Click **"Sign In"** button
4. Authorize with Google
5. Use "Save", "Save As New", "Load" buttons

## First-Time Authentication

When you first click "Sign In":

1. Google OAuth popup appears
2. Sign in with your Google account
3. See "Google hasn't verified this app" warning
4. Click **"Advanced"** → **"Go to D&D Character Sheet (unsafe)"**
5. Grant permission to access Drive
6. You're signed in!

**Each user authenticates with their own Google account.**

## For Friends/Other Users

When sharing with friends:
- Give them the GitHub Pages URL
- They click "Sign In"
- They go through the same auth process
- Their data saves to **their own** Google Drive

## Security & Privacy

✅ **Each user's data is isolated:**
- Users authenticate with their own Google account
- Files stored in each user's own Drive
- One user cannot access another user's files

✅ **Limited Drive access:**
- App only accesses files it creates
- Cannot see or modify other Drive files
- Uses `drive.file` scope (most restrictive)

⚠️ **"Unverified app" warning:**
- Shows for personal/non-verified apps
- Safe to ignore for personal/friend use
- Google verification requires business use case

## Troubleshooting

### "Sign In" button doesn't appear
- Check browser console for errors
- Ensure Google Identity Services script loaded
- Check Client ID is set correctly

### OAuth popup blocked
- Allow popups for the site
- Try again

### "Session expired" error
- Sign out and sign in again
- OAuth tokens expire after ~1 hour
- Refresh page if needed

## Project Structure

```
├── src/                          # TypeScript source
│   ├── character-sheet.ts        # Main character sheet logic
│   └── google-drive-manager.ts   # Google Drive OAuth & API client
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
   - Uses Google Identity Services for OAuth

2. **Authentication** (Google OAuth):
   - User clicks "Sign In"
   - OAuth popup for consent
   - Access token granted (~1 hour)
   - Token used for API calls

3. **Storage** (Google Drive API):
   - Direct API calls to Drive
   - Each user's files in their own Drive
   - Files use `.json` format with character data + layout

## License

MIT
