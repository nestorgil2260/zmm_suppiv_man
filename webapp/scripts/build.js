#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

const appRoot = path.join(__dirname, '..');
const projectRoot = path.join(appRoot, '..');
const sourceDir = appRoot;
const distDir = path.join(projectRoot, 'dist');

// Limpiar dist para evitar arrastrar artefactos previos del builder UI5.
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// Crear subdirectorios necesarios
const dirs = ['controller', 'view', 'view/blocks', 'view/blocks/S1', 'fragment', 'i18n', 'localService', 'resources'];
dirs.forEach(dir => {
  const targetDir = path.join(distDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

// Función para copiar archivo
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Función para minificar JS
function minifyFile(src, dest) {
  try {
    const code = fs.readFileSync(src, 'utf8');
    const result = UglifyJS.minify(code, {
      compress: true,
      mangle: true,
      output: { comments: false }
    });
    
    if (result.error) {
      console.warn(`Warning minifying ${src}: ${result.error}`);
      // Si hay error, copiar sin minificar
      fs.copyFileSync(src, dest);
    } else {
      fs.writeFileSync(dest, result.code);
    }
  } catch (err) {
    console.warn(`Warning processing ${src}: ${err.message}`);
    // Si hay error, copiar sin minificar
    fs.copyFileSync(src, dest);
  }
}

// Copiar archivos controller
console.log('Processing controller files...');
const controllerFiles = fs.readdirSync(path.join(sourceDir, 'controller'));
controllerFiles.forEach(file => {
  if (file.endsWith('.js')) {
    const src = path.join(sourceDir, 'controller', file);
    const dest = path.join(distDir, 'controller', file);
    if (file.endsWith('-dbg.js')) {
      // Copiar archivos -dbg.js sin cambios
      copyFile(src, dest);
    } else if (!file.endsWith('.min.js')) {
      // Los .controller.js se copian directamente
      copyFile(src, dest);
    }
  }
});

// Copiar archivos view
console.log('Processing view files...');
const viewDir = path.join(sourceDir, 'view');
if (fs.existsSync(viewDir)) {
  const viewFiles = fs.readdirSync(viewDir);
  viewFiles.forEach(file => {
    const src = path.join(viewDir, file);
    const stat = fs.statSync(src);
    if (stat.isFile()) {
      const dest = path.join(distDir, 'view', file);
      copyFile(src, dest);
    } else if (stat.isDirectory()) {
      const subDir = path.join(distDir, 'view', file);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
    }
  });
}

// Copiar archivos view/blocks
console.log('Processing view/blocks files...');
const blocksDir = path.join(sourceDir, 'view', 'blocks', 'S1');
if (fs.existsSync(blocksDir)) {
  const blocksFiles = fs.readdirSync(blocksDir);
  blocksFiles.forEach(file => {
    const src = path.join(blocksDir, file);
    const dest = path.join(distDir, 'view', 'blocks', 'S1', file);
    copyFile(src, dest);
  });
}

// Copiar archivos fragment
console.log('Processing fragment files...');
const fragmentDir = path.join(sourceDir, 'fragment');
if (fs.existsSync(fragmentDir)) {
  const fragmentFiles = fs.readdirSync(fragmentDir);
  fragmentFiles.forEach(file => {
    const src = path.join(fragmentDir, file);
    const dest = path.join(distDir, 'fragment', file);
    copyFile(src, dest);
  });
}

// Copiar archivos i18n
console.log('Processing i18n files...');
const i18nDir = path.join(sourceDir, 'i18n');
if (fs.existsSync(i18nDir)) {
  const i18nFiles = fs.readdirSync(i18nDir);
  i18nFiles.forEach(file => {
    const src = path.join(i18nDir, file);
    const dest = path.join(distDir, 'i18n', file);
    copyFile(src, dest);
  });
}

// Copiar archivos principales
// NOTA: Se usa un Component-preload.js mínimo que NO contiene definiciones de controladores
// Esto fuerza que SAP cargue los archivos individuales corregidos en lugar del preload
console.log('Processing root files...');
const filesToCopy = [
  'Component.js',
  'Component-dbg.js',
  // 'Component-preload.js',  // EXCLUIDO: Será generado como archivo mínimo al final
  'serviceBinding.js',
  'serviceBinding-dbg.js',
  'manifest.json',
  'index.html',
  'neo-app.json',
  'resources.json',
  'sap-ui-cachebuster-info.json'
];

filesToCopy.forEach(file => {
  const src = path.join(sourceDir, file);
  if (fs.existsSync(src)) {
    const dest = path.join(distDir, file);
    copyFile(src, dest);
  }
});

// Copiar localService
console.log('Processing localService files...');
const localServiceDir = path.join(sourceDir, 'localService');
if (fs.existsSync(localServiceDir)) {
  const copyLocalService = (src, relative = '') => {
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const itemPath = path.join(src, item);
      const destItem = path.join(distDir, 'localService', relative, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isFile()) {
        copyFile(itemPath, destItem);
      } else if (stat.isDirectory()) {
        const destDir = path.dirname(destItem);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        copyLocalService(itemPath, path.join(relative, item));
      }
    });
  };
  copyLocalService(localServiceDir);
}

// Copiar resources
console.log('Processing resources files...');
const resourcesDir = path.join(sourceDir, 'resources');
if (fs.existsSync(resourcesDir)) {
  const resourcesFiles = fs.readdirSync(resourcesDir);
  resourcesFiles.forEach(file => {
    const src = path.join(resourcesDir, file);
    const dest = path.join(distDir, 'resources', file);
    copyFile(src, dest);
  });
}

// Generar Component-preload.js mínimo
// IMPORTANTE: Solo incluye Component.js y fragmentos, NO incluye controladores
// Esto fuerza que SAP cargue los archivos individuales corregidos
console.log('Generating minimal Component-preload.js...');
const preloadContent = `//@ui5-bundle ui/s2p/mm/supplinvoice/manage/s1/ZMM_SUPPIV_MANS1Extension/Component-preload.js
jQuery.sap.registerPreloadedModules({
"version":"2.0",
"modules":{
	"ui/s2p/mm/supplinvoice/manage/s1/ZMM_SUPPIV_MANS1Extension/Component.js":function(){jQuery.sap.declare("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.Component");sap.ui.component.load({name:"ui.s2p.mm.supplinvoice.manage.s1",url:"/sap/bc/ui5_ui5/sap/MM_SUPPIV_MANS1"});this.ui.s2p.mm.supplinvoice.manage.s1.Component.extend("ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension.Component",{metadata:{manifest:"json"}});
}
}});`;

fs.writeFileSync(path.join(distDir, 'Component-preload.js'), preloadContent);

console.log(`\n✓ Build completed successfully!`);
console.log(`✓ Distribution files generated in: ${distDir}`);
console.log(`✓ Ready for deployment to SAP system`);
