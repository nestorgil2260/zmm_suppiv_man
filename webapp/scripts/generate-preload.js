#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

const projectRoot = path.join(__dirname, '..');
const sourceDir = projectRoot;
const distDir = path.join(projectRoot, 'dist');

console.log('Generating corrected Component-preload.js...');

// Read the original preload file
const preloadPath = path.join(sourceDir, 'Component-preload.js');
let preloadContent = fs.readFileSync(preloadPath, 'utf8');

// Read corrected controllers
const appCustomPath = path.join(sourceDir, 'controller', 'AppCustom.controller.js');
const s1CustomPath = path.join(sourceDir, 'controller', 'S1Custom.controller.js');

const appCustomCode = fs.readFileSync(appCustomPath, 'utf8');
const s1CustomCode = fs.readFileSync(s1CustomPath, 'utf8');

// Replace the controller code in preload with corrected versions
// AppCustom controller - replace the inline function
const appCustomRegex = /"ui\/s2p\/mm\/supplinvoice\/manage\/s1\/ZMM_SUPPIV_MANS1Extension\/controller\/AppCustom\.controller\.js":function\(\)\{sap\.ui\.define\(\[.*?\]\);?return .*?\}\),/;
const appCustomReplacement = `"ui/s2p/mm/supplinvoice/manage/s1/ZMM_SUPPIV_MANS1Extension/controller/AppCustom.controller.js":function(){${appCustomCode}},`;

preloadContent = preloadContent.replace(appCustomRegex, appCustomReplacement);

// S1Custom controller - more complex due to size
const s1CustomRegex = /"ui\/s2p\/mm\/supplinvoice\/manage\/s1\/ZMM_SUPPIV_MANS1Extension\/controller\/S1Custom\.controller\.js":function\(\)\{sap\.ui\.define\(\[.*?\]\);?return .*?\}\),/s;
const s1CustomReplacement = `"ui/s2p/mm/supplinvoice/manage/s1/ZMM_SUPPIV_MANS1Extension/controller/S1Custom.controller.js":function(){${s1CustomCode}},`;

preloadContent = preloadContent.replace(s1CustomRegex, s1CustomReplacement);

// Write corrected preload
const outputPath = path.join(distDir, 'Component-preload.js');
fs.writeFileSync(outputPath, preloadContent);

console.log('✓ Component-preload.js regenerated with corrected controllers');
console.log(`✓ File saved to: ${outputPath}`);
