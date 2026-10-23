// One-command local setup: `npm run setup` (run inside web/ after `npm install`).
// Creates .env from .env.example if missing, builds the SQLite database and imports all content.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  console.log('Created .env from .env.example');
}
if (!existsSync('../_source/api')) {
  console.error('Missing ../_source (imported content). Clone the whole repository, not just web/.');
  process.exit(1);
}

run('npx prisma db push --skip-generate');
run('npx prisma generate');
run('npx tsx prisma/seed.ts');

console.log('\nSetup complete. Start the site with:  npm run dev   ->  http://localhost:3000');
