# D&D 5e Character Sheet

A modern, interactive character sheet for D&D 5th Edition with Google Drive integration.

## Features

- Interactive character sheet for D&D 5e
- Local storage for offline use
- Google Drive integration (coming soon)
- TypeScript for type safety
- Responsive design

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

## Project Structure

```
├── src/           # TypeScript source files
├── dist/          # Compiled JavaScript (generated)
├── css/           # Stylesheets
├── index.html     # Main HTML file
└── .github/       # GitHub Actions workflows
```
