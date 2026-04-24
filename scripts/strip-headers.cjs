#!/usr/bin/env node
/**
 * Strip old <header>…</header> blocks from every page JSX.
 * Leaves everything else intact.
 */
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let changed = 0;

for (const file of files) {
  if (file === 'BookingDetailsPage.jsx') continue; // already done
  
  const filepath = path.join(pagesDir, file);
  let src = fs.readFileSync(filepath, 'utf-8');
  
  // Match <header ... > ... </header> including all whitespace around it
  // We look for patterns like:
  //   <header className="...">  ...  </header>
  const headerRegex = /\n\s*<header[\s\S]*?<\/header>\s*\n/g;
  
  if (!headerRegex.test(src)) continue;
  
  const newSrc = src.replace(headerRegex, '\n');
  
  if (newSrc !== src) {
    fs.writeFileSync(filepath, newSrc);
    console.log(`✅ Stripped header from ${file}`);
    changed++;
  }
}

console.log(`\nDone. ${changed} files updated.`);
