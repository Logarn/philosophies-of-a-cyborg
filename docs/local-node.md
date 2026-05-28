# Local Node Version

This project targets Node 24 because Vercel Serverless Functions currently run it on Node 24.

The repo includes both \`.nvmrc\` and \`.node-version\` so common version managers can select the right runtime.

Recommended local setup on this machine:

\`\`\`sh
brew install node@24
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm run build
\`\`\`

That keeps the system Homebrew \`node\` package on its current version while letting this project build with the same major Node version Vercel uses.
