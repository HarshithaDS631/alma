const fs = require('fs');
const path = require('path');

// Helper to copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const distDir = path.join(__dirname, 'dist');

// 1. Write to dist/vercel.json (for static builders)
const distVercelFile = path.join(distDir, 'vercel.json');
const vercelJsonConfig = {
  cleanUrls: false,
  rewrites: [
    {
      source: "/:path*",
      destination: "/index.html"
    }
  ]
};

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
fs.writeFileSync(distVercelFile, JSON.stringify(vercelJsonConfig, null, 2), 'utf8');
console.log('Successfully wrote vercel.json to dist/vercel.json');

// 2. Write to .vercel/output/config.json (for Build Output API)
const vercelOutputDir = path.join(__dirname, '.vercel', 'output');
const configJsonFile = path.join(vercelOutputDir, 'config.json');

const buildOutputConfig = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" }
  ]
};

if (!fs.existsSync(vercelOutputDir)) {
  fs.mkdirSync(vercelOutputDir, { recursive: true });
}
fs.writeFileSync(configJsonFile, JSON.stringify(buildOutputConfig, null, 2), 'utf8');
console.log('Successfully wrote config.json to .vercel/output/config.json');

// 3. Copy dist contents to .vercel/output/static (for Build Output API)
const vercelStaticDir = path.join(vercelOutputDir, 'static');
console.log('Copying build output from dist/ to .vercel/output/static for Build Output API...');
try {
  if (fs.existsSync(vercelStaticDir)) {
    fs.rmSync(vercelStaticDir, { recursive: true, force: true });
  }
  if (fs.existsSync(distDir)) {
    copyDirRecursive(distDir, vercelStaticDir);
    console.log('Successfully copied all dist files to .vercel/output/static.');
  }
} catch (error) {
  console.error('Error copying to .vercel/output/static:', error);
}

// 4. Copy dist contents to the project root directory and sync index.html
console.log('Copying build output from dist/ to project root...');
try {
  if (fs.existsSync(distDir)) {
    // Clean old _expo directory in root to prevent stale bundles
    const rootExpoDir = path.join(__dirname, '_expo');
    if (fs.existsSync(rootExpoDir)) {
      fs.rmSync(rootExpoDir, { recursive: true, force: true });
    }

    const files = fs.readdirSync(distDir);
    for (const file of files) {
      const srcPath = path.join(distDir, file);
      const destPath = path.join(__dirname, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true, force: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      console.log(`Copied ${file} to root.`);
    }
    console.log('Successfully copied all dist files to root.');
  }
} catch (error) {
  console.error('Error copying to root:', error);
}
