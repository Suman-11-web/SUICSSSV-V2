const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const FRAMEWORK_VERSION = '2.1.0';
const CSS_BANNER = `/*!
 * SUI.css v${FRAMEWORK_VERSION}
 * Ultra Pro Max Modern CSS Framework
 * https://github.com/suman-11-web/SUICSSSV-V2
 * License: MIT
 */\n`;

const JS_BANNER = `/*!
 * SUI.css v${FRAMEWORK_VERSION} Core Interactive Engine
 * https://github.com/suman-11-web/SUICSSSV-V2
 * License: MIT
 */\n`;

function ensureDirectories() {
  const dirs = ['dist', 'public', 'public/dist'];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }
}

function buildCss() {
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

  let fullCss = CSS_BANNER + '@layer reset, tokens, layout, code, components, utilities, animations;\n\n';
  for (const layer of layers) {
    const layerPath = path.join('src/layers', layer);
    if (fs.existsSync(layerPath)) {
      const content = fs.readFileSync(layerPath, 'utf-8');
      fullCss += '/* Layer: ' + layer + ' */\n' + content + '\n\n';
    } else {
      console.warn(`[WARN] Layer file missing: ${layerPath}`);
    }
  }

  // Minify CSS using esbuild
  const minifiedCss = esbuild.transformSync(fullCss, {
    loader: 'css',
    minify: true,
    banner: CSS_BANNER.trim()
  });

  // Write unminified CSS
  fs.writeFileSync('dist/sui.css', fullCss);
  fs.writeFileSync('public/sui.css', fullCss);
  fs.writeFileSync('public/dist/sui.css', fullCss);

  // Write minified CSS
  fs.writeFileSync('dist/sui.min.css', minifiedCss.code);
  fs.writeFileSync('public/sui.min.css', minifiedCss.code);
  fs.writeFileSync('public/dist/sui.min.css', minifiedCss.code);

  console.log(`✓ CSS Bundle generated: dist/sui.css (${fullCss.length} bytes) & dist/sui.min.css (${minifiedCss.code.length} bytes)`);
}

function buildJs() {
  // 1. Unminified JS
  esbuild.buildSync({
    entryPoints: ['src/sui.js'],
    bundle: true,
    minify: false,
    banner: { js: JS_BANNER },
    outfile: 'dist/sui.js'
  });
  fs.copyFileSync('dist/sui.js', 'public/sui.js');
  fs.copyFileSync('dist/sui.js', 'public/dist/sui.js');

  // 2. Minified JS
  esbuild.buildSync({
    entryPoints: ['src/sui.js'],
    bundle: true,
    minify: true,
    banner: { js: JS_BANNER.trim() },
    outfile: 'dist/sui.min.js'
  });
  fs.copyFileSync('dist/sui.min.js', 'public/sui.min.js');
  fs.copyFileSync('dist/sui.min.js', 'public/dist/sui.min.js');

  console.log(`✓ JS Bundle generated: dist/sui.js (${fs.statSync('dist/sui.js').size} bytes) & dist/sui.min.js (${fs.statSync('dist/sui.min.js').size} bytes)`);

  // Ensure logosui.png is in public
  if (fs.existsSync('docs/logosui.png') && !fs.existsSync('public/logosui.png')) {
    fs.copyFileSync('docs/logosui.png', 'public/logosui.png');
  }
}

function verifyBuild() {
  const artifacts = [
    { path: 'dist/sui.css', minSize: 100000, desc: 'Unminified CSS Bundle' },
    { path: 'dist/sui.min.css', minSize: 50000, desc: 'Minified CSS Bundle' },
    { path: 'dist/sui.js', minSize: 30000, desc: 'Unminified JS Bundle' },
    { path: 'dist/sui.min.js', minSize: 15000, desc: 'Minified JS Bundle' }
  ];

  console.log('\n--- Verifying SUI.css v' + FRAMEWORK_VERSION + ' CDN Build Artifacts ---');
  let hasFailure = false;

  for (const art of artifacts) {
    if (!fs.existsSync(art.path)) {
      console.error(`❌ Verification failed: ${art.path} does not exist!`);
      hasFailure = true;
      continue;
    }

    const stat = fs.statSync(art.path);
    if (stat.size < art.minSize) {
      console.error(`❌ Verification failed: ${art.path} is too small (${stat.size} bytes, expected >= ${art.minSize})!`);
      hasFailure = true;
      continue;
    }

    const content = fs.readFileSync(art.path, 'utf-8');
    if (art.path.endsWith('.css') && !content.includes('@layer')) {
      console.error(`❌ Verification failed: ${art.path} does not contain modern @layer rules!`);
      hasFailure = true;
      continue;
    }

    if (art.path.endsWith('.js') && !content.includes(FRAMEWORK_VERSION)) {
      console.error(`❌ Verification failed: ${art.path} does not contain version ${FRAMEWORK_VERSION}!`);
      hasFailure = true;
      continue;
    }

    console.log(`✓ ${art.path} (${art.desc}): ${(stat.size / 1024).toFixed(2)} KB [VALID]`);
  }

  if (hasFailure) {
    console.error('\n❌ Build verification FAILED. One or more required artifacts are invalid or missing.\n');
    process.exit(1);
  }

  console.log('✓ All CDN artifacts verified and ready for release tagging.\n');
}

function syncPostBuild() {
  ensureDirectories();
  // Ensure Vite build output in dist/ contains dist/ subdirectory
  const bundles = ['sui.css', 'sui.min.css', 'sui.js', 'sui.min.js'];
  for (const b of bundles) {
    const src = path.join('public', b);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join('dist', b));
    }
    const distSub = path.join('dist/dist', b);
    if (!fs.existsSync(distSub) && fs.existsSync(src)) {
      fs.mkdirSync('dist/dist', { recursive: true });
      fs.copyFileSync(src, distSub);
    }
  }
  verifyBuild();
}

const isPost = process.argv.includes('--post');
const isVerifyOnly = process.argv.includes('--verify');

if (isVerifyOnly) {
  verifyBuild();
} else if (isPost) {
  syncPostBuild();
} else {
  ensureDirectories();
  buildCss();
  buildJs();
  verifyBuild();
}
