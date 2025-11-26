#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceIcon = 'public/logo-with-bg.png';
const androidResPath = 'src-tauri/gen/android/app/src/main/res';

// Android icon sizes
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

console.log('Generating Android launcher icons...');

// Check if ImageMagick is available
let hasImageMagick = false;
try {
  execSync('convert -version', { stdio: 'ignore' });
  hasImageMagick = true;
  console.log('Using ImageMagick for icon generation');
} catch (e) {
  console.log('ImageMagick not found, will copy base icon');
}

for (const [folder, size] of Object.entries(iconSizes)) {
  const targetDir = path.join(androidResPath, folder);
  const targetFile = path.join(targetDir, 'ic_launcher.png');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  if (hasImageMagick) {
    try {
      execSync(`convert "${sourceIcon}" -resize ${size}x${size} "${targetFile}"`);
      console.log(`✓ Generated ${folder}/ic_launcher.png (${size}x${size})`);
    } catch (e) {
      console.error(`✗ Failed to generate ${folder}/ic_launcher.png`);
    }
  } else {
    // Fallback: just copy the source icon
    fs.copyFileSync(sourceIcon, targetFile);
    console.log(`✓ Copied to ${folder}/ic_launcher.png (will be scaled by Android)`);
  }
}

// Also create adaptive icon XMLs
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher"/>
</adaptive-icon>`;

const v26Dir = path.join(androidResPath, 'mipmap-anydpi-v26');
if (!fs.existsSync(v26Dir)) {
  fs.mkdirSync(v26Dir, { recursive: true });
}

fs.writeFileSync(path.join(v26Dir, 'ic_launcher.xml'), adaptiveIconXml);
console.log('✓ Generated adaptive icon XML');

// Add background color to values/colors.xml
const valuesDir = path.join(androidResPath, 'values');
const colorsFile = path.join(valuesDir, 'colors.xml');

let colorsXml = '';
if (fs.existsSync(colorsFile)) {
  colorsXml = fs.readFileSync(colorsFile, 'utf8');
} else {
  colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
</resources>`;
}

// Add launcher background color if not present
if (!colorsXml.includes('ic_launcher_background')) {
  colorsXml = colorsXml.replace('</resources>', 
    '    <color name="ic_launcher_background">#C62828</color>\n</resources>');
  fs.writeFileSync(colorsFile, colorsXml);
  console.log('✓ Added launcher background color');
}

console.log('\n✅ Android icons generated successfully!');
