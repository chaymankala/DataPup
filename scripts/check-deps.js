const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = require('../package.json');
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
const missing = [];

for (const dep of Object.keys(allDeps)) {
  if (!fs.existsSync(path.join('node_modules', dep))) {
    missing.push(dep);
  }
}

if (missing.length) {
  console.log(`Missing dependencies: ${missing.join(', ')}`);
  const prompt = require('readline-sync').question('Install them now? (Y/n): ');
  if (prompt.toLowerCase() === 'n') {
    process.exit(1);
  }
  execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
} else {
  console.log('All dependencies are installed.');
}
