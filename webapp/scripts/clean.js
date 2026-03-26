#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');
const projectRoot = path.join(appRoot, '..');
const distDir = path.join(projectRoot, 'dist');

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        removeDir(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dir);
    console.log(`✓ Removed: ${dir}`);
  }
}

removeDir(distDir);
console.log(`\n✓ Clean completed!`);
