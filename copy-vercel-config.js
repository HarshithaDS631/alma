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
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" }
      ]
    }
  ],
  rewrites: [
    {
      source: "/api/:path*",
      destination: "/api"
    },
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

// 2. Clean .vercel directory so Vercel uses standard deployment mode (detecting api/index.js as Serverless Function)
const vercelDir = path.join(__dirname, '.vercel');
if (fs.existsSync(vercelDir)) {
  try {
    fs.rmSync(vercelDir, { recursive: true, force: true });
    console.log('Cleaned .vercel directory to ensure standard Vercel serverless function detection.');
  } catch (err) {
    console.warn('Warning cleaning .vercel directory:', err.message);
  }
}

// 3. Copy dist contents to the project root directory and sync index.html
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
