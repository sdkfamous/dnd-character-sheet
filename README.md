# D&D 5e Character Sheet

A modern, interactive character sheet for D&D 5th Edition with Google Drive integration.

## Features

- Interactive character sheet for D&D 5e
- Local file storage (File System Access API)
- **Google Drive cloud storage** (via Google Apps Script)
- Dynamic lists (skills, weapons, spells)
- Resizable sections with layout persistence
- Undo/Redo functionality
- TypeScript for type safety
- Responsive design (mobile-friendly)

## Development

### Prerequisites

- Node.js 20+
- npm or pnpm

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Compile TypeScript (one-time):
```bash
npm run build
```

3. Watch mode (auto-compile on changes):
```bash
npm run watch
```

4. Serve locally (in another terminal):
```bash
npm run serve
```

Then open http://localhost:8000 in your browser.

## Deployment

The project uses GitHub Actions to automatically:
- Compile TypeScript to JavaScript on push
- Deploy to GitHub Pages

Just push your TypeScript code to the `main` branch, and GitHub Actions will handle the rest.

## Google Drive Setup

To enable Google Drive cloud storage, see [SETUP.md](SETUP.md) for detailed instructions on deploying the Google Apps Script backend.

Quick steps:
1. Create a Google Apps Script project
2. Copy `apps-script/Code.gs` to your Apps Script project
3. Deploy as a Web App
4. Add the Web App URL to `src/character-sheet.ts` (set `APPS_SCRIPT_URL`)

## Project Structure

```
├── src/                    # TypeScript source files
│   ├── character-sheet.ts  # Main character sheet logic
│   └── google-drive-manager.ts  # Google Drive API client
├── apps-script/            # Google Apps Script backend
│   └── Code.gs             # Apps Script code template
├── dist/                   # Compiled JavaScript (generated)
├── css/                    # Stylesheets
├── index.html              # Main HTML file
└── .github/                # GitHub Actions workflows
```
