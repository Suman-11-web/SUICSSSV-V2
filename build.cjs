const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

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

fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('dist/sui.css', fullCss);

const minifiedCss = esbuild.transformSync(fullCss, { loader: 'css', minify: true });
fs.writeFileSync('dist/sui.min.css', minifiedCss.code);
fs.writeFileSync('public/sui.min.css', minifiedCss.code);
console.log('✓ CSS Bundle generated: dist/sui.min.css (' + minifiedCss.code.length + ' bytes)');

// 2. Bundle JS
esbuild.buildSync({
  entryPoints: ['src/sui.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/sui.min.js'
});
fs.copyFileSync('dist/sui.min.js', 'public/sui.min.js');
console.log('✓ JS Bundle generated: dist/sui.min.js (' + fs.statSync('dist/sui.min.js').size + ' bytes)');
