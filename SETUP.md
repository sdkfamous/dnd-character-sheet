# Setup Instructions

## Initial Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Compile TypeScript locally (for development):**
```bash
npm run build
```

3. **Start local server:**
```bash
npm run serve
```

Then open http://localhost:8000 in your browser.

## Development Workflow

1. **Edit TypeScript files** in `src/`
2. **Watch mode** (auto-compile on save):
```bash
npm run watch
```

3. **Refresh browser** to see changes

## GitHub Setup

1. **Create a new GitHub repository**

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
   - Branch: `gh-pages` (will be created by GitHub Actions)
   - Save

4. **GitHub Actions will automatically:**
   - Compile TypeScript on every push
   - Deploy to GitHub Pages
   - Your site will be available at: `https://<username>.github.io/<repo-name>/`

## File Structure

```
├── src/                    # TypeScript source files
│   └── character-sheet.ts
├── dist/                   # Compiled JavaScript (generated)
│   └── character-sheet.js
├── css/                    # Stylesheets
│   └── styles.css
├── index.html              # Main HTML file
├── tsconfig.json           # TypeScript configuration
├── package.json            # npm configuration
└── .github/
    └── workflows/
        └── build.yml       # GitHub Actions workflow
```

## Notes

- **Local development**: Compile TypeScript manually or use watch mode
- **GitHub deployment**: TypeScript is automatically compiled by GitHub Actions
- **Data storage**: Currently uses localStorage (browser storage)
- **Google Drive integration**: Coming soon!
