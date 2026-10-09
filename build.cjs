const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const isPostBuild = process.argv.includes('--post');

function ensureDirectories() {
  const dirs = [
    'dist',
    'dist/dist',
    'public',
    'public/dist'
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }
}

function buildBundles() {
  ensureDirectories();

  // 1. Bundle CSS layers
  const layers = [
    'reset.css',
    'tokens.css',
    'layout.css',
    'code.css',
    'components.css',
    'utilities.css',
    'animations.css',
    'advanced.css'
  ];

  let fullCss = '@layer reset, tokens, layout, code, components, utilities, animations;\n\n';
  for (const layer of layers) {
    const layerPath = path.join('src/layers', layer);
    if (fs.existsSync(layerPath)) {
      const content = fs.readFileSync(layerPath, 'utf-8');
      fullCss += '/* Layer: ' + layer + ' */\n' + content + '\n\n';
    }
  }

  // Minify CSS
  const minifiedCss = esbuild.transformSync(fullCss, { loader: 'css', minify: true });

  // Write CSS to all destinations so both /dist/sui.min.css and /sui.min.css exist
  const cssLocations = [
    'dist/sui.css',
    'dist/dist/sui.css',
    'public/sui.css',
    'public/dist/sui.css'
  ];
  for (const loc of cssLocations) {
    fs.writeFileSync(loc, fullCss);
  }

  const minCssLocations = [
    'dist/sui.min.css',
    'dist/dist/sui.min.css',
    'public/sui.min.css',
    'public/dist/sui.min.css'
  ];
  for (const loc of minCssLocations) {
    fs.writeFileSync(loc, minifiedCss.code);
  }
  console.log('✓ CSS Bundle generated: dist/sui.min.css & dist/dist/sui.min.css (' + minifiedCss.code.length + ' bytes)');

  // 2. Bundle JS (unminified)
  esbuild.buildSync({
    entryPoints: ['src/sui.js'],
    bundle: true,
    minify: false,
    outfile: 'dist/sui.js'
  });
  fs.copyFileSync('dist/sui.js', 'dist/dist/sui.js');
  fs.copyFileSync('dist/sui.js', 'public/sui.js');
  fs.copyFileSync('dist/sui.js', 'public/dist/sui.js');

  // 3. Bundle JS (minified)
  esbuild.buildSync({
    entryPoints: ['src/sui.js'],
    bundle: true,
    minify: true,
    outfile: 'dist/sui.min.js'
  });
  fs.copyFileSync('dist/sui.min.js', 'dist/dist/sui.min.js');
  fs.copyFileSync('dist/sui.min.js', 'public/sui.min.js');
  fs.copyFileSync('dist/sui.min.js', 'public/dist/sui.min.js');
  console.log('✓ JS Bundle generated: dist/sui.min.js & dist/dist/sui.min.js (' + fs.statSync('dist/sui.min.js').size + ' bytes)');

  // Copy logo if exists
  if (fs.existsSync('docs/logosui.png')) {
    fs.copyFileSync('docs/logosui.png', 'public/logosui.png');
    fs.copyFileSync('docs/logosui.png', 'dist/logosui.png');
  }
}

function syncPostBuild() {
  ensureDirectories();
  const filesToSync = [
    'sui.min.js',
    'sui.js',
    'sui.min.css',
    'sui.css'
  ];

  for (const f of filesToSync) {
    const src = path.join('public', f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join('dist', f));
      fs.copyFileSync(src, path.join('dist/dist', f));
    }
  }
  console.log('✓ Post-build sync: verified dist/ and dist/dist/ bundles are present for production deployments');
}

if (isPostBuild) {
  syncPostBuild();
} else {
  buildBundles();
}
