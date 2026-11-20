const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const STORE_ASSETS_DIR = path.resolve(__dirname, '..', 'store-assets');
const TEMP_DIR = path.join(STORE_ASSETS_DIR, 'temp_html');

if (!fs.existsSync(STORE_ASSETS_DIR)) {
  fs.mkdirSync(STORE_ASSETS_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper to get base64 data URI
function getBase64Asset(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath).slice(1);
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${fs.readFileSync(fullPath).toString('base64')}`;
  }
  return '';
}

const crestBase64 = getBase64Asset('assets/images/rv_garudas_crest.png');
const mascotBase64 = getBase64Asset('assets/images/mascot.png');

// Shared CSS styles for mobile UI screens
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0A192F;
    color: #FFFFFF;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
`;

// 1. Generate Feature Graphic (1024 x 500)
function buildFeatureGraphicHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${sharedStyles}
  .canvas {
    width: 1024px;
    height: 500px;
    position: relative;
    background: linear-gradient(135deg, #071326 0%, #0A192F 45%, #0F2C59 100%);
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 0 48px;
  }
  /* Decorative Grid & Glow */
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(202, 160, 37, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(202, 160, 37, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .radial-glow {
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(202, 160, 37, 0.18) 0%, rgba(15, 44, 89, 0) 70%);
    top: -100px;
    left: 200px;
    pointer-events: none;
  }
  .left-content {
    flex: 1;
    z-index: 10;
    max-width: 540px;
  }
  .badge-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .crest-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(202, 160, 37, 0.4));
  }
  .estd-pill {
    background: rgba(202, 160, 37, 0.12);
    border: 1px solid rgba(202, 160, 37, 0.4);
    color: #CAA025;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }
  .title-main {
    font-size: 44px;
    font-weight: 900;
    color: #FFFFFF;
    line-height: 1.05;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }
  .title-main span {
    background: linear-gradient(135deg, #FDE68A 0%, #CAA025 60%, #B8860B 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .subtitle {
    font-size: 15px;
    color: #CBD5E1;
    line-height: 1.5;
    margin-bottom: 22px;
  }
  .institutions-row {
    display: flex;
    gap: 8px;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }
  .inst-tag {
    background: #112240;
    border: 1px solid #233554;
    color: #93C5FD;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #E2E8F0;
    font-weight: 600;
  }
  .feature-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #CAA025;
    box-shadow: 0 0 8px #CAA025;
  }

  /* Right Showcase Phone Mockup */
  .right-showcase {
    position: relative;
    width: 420px;
    height: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mascot-img {
    position: absolute;
    right: -20px;
    bottom: -15px;
    height: 280px;
    z-index: 20;
    filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
  }
  .phone-frame {
    width: 250px;
    height: 440px;
    background: #0B132B;
    border-radius: 36px;
    border: 7px solid #1E293B;
    box-shadow: 
      0 25px 60px rgba(0,0,0,0.7),
      inset 0 0 0 2px rgba(202, 160, 37, 0.4);
    position: relative;
    overflow: hidden;
    margin-right: 60px;
    transform: rotate(-3deg);
  }
  .dynamic-island {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 75px;
    height: 18px;
    background: #000;
    border-radius: 12px;
    z-index: 30;
  }
  .phone-screen {
    width: 100%;
    height: 100%;
    padding: 34px 12px 12px;
    background: #0A192F;
    font-size: 10px;
  }
  .mini-header {
    background: #0F2C59;
    padding: 8px;
    border-radius: 10px;
    border: 1px solid rgba(202, 160, 37, 0.3);
    margin-bottom: 8px;
  }
  .mini-header-title {
    color: #CAA025;
    font-weight: 800;
    font-size: 10px;
  }
  .mini-card {
    background: #112240;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 6px;
    border: 1px solid #1E293B;
  }
  .mini-card-tag {
    color: #CAA025;
    font-weight: 700;
    font-size: 8px;
    margin-bottom: 2px;
  }
  .mini-card-text {
    color: #F8FAFC;
    font-weight: 600;
    font-size: 9px;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="grid-overlay"></div>
    <div class="radial-glow"></div>
    <div class="left-content">
      <div class="badge-row">
        ${crestBase64 ? `<img src="${crestBase64}" class="crest-img" />` : ''}
        <div class="estd-pill">• RSST Central Campus • Estd 1940 •</div>
      </div>
      <div class="title-main">RV ALUMNI<br/><span>NETWORK</span></div>
      <div class="subtitle">Official networking, career referral, and 1-on-1 mentorship platform empowering 45,000+ graduates globally.</div>
      <div class="institutions-row">
        <div class="inst-tag">RVCE</div>
        <div class="inst-tag">RVU</div>
        <div class="inst-tag">RVIM</div>
        <div class="inst-tag">RVCA</div>
        <div class="inst-tag">RSST</div>
      </div>
      <div class="features-grid">
        <div class="feature-item"><div class="feature-dot"></div>Verified Alumni Directory</div>
        <div class="feature-item"><div class="feature-dot"></div>Insider Career Referrals</div>
        <div class="feature-item"><div class="feature-dot"></div>1-on-1 Executive Mentorship</div>
        <div class="feature-item"><div class="feature-dot"></div>Digital QR Event Passes</div>
      </div>
    </div>
    <div class="right-showcase">
      <div class="phone-frame">
        <div class="dynamic-island"></div>
        <div class="phone-screen">
          <div class="mini-header">
            <div class="mini-header-title">🎓 RV ALUMNI FEED</div>
            <div style="color:#CBD5E1;font-size:8px;">Welcome, Rahul Sharma ('18)</div>
          </div>
          <div class="mini-card" style="border-left: 3px solid #CAA025;">
            <div class="mini-card-tag">💼 JOB REFERRAL • GOOGLE</div>
            <div class="mini-card-text">Staff Software Engineer • Bengaluru</div>
            <div style="color:#94A3B8;font-size:8px;margin-top:2px;">Shared by Aditi Rao ('16) • 12 referrals sent</div>
          </div>
          <div class="mini-card" style="border-left: 3px solid #60A5FA;">
            <div class="mini-card-tag" style="color:#60A5FA;">🤝 MENTORSHIP CALL</div>
            <div class="mini-card-text">AI Systems Architecture with CTO</div>
            <div style="color:#94A3B8;font-size:8px;margin-top:2px;">Booked for Saturday, 11:00 AM</div>
          </div>
          <div class="mini-card" style="border-left: 3px solid #34D399;">
            <div class="mini-card-tag" style="color:#34D399;">📅 REUNION 2026</div>
            <div class="mini-card-text">Global RVCE Alumni Conclave</div>
            <div style="color:#94A3B8;font-size:8px;margin-top:2px;">Pass confirmed • Digital QR ready</div>
          </div>
        </div>
      </div>
      ${mascotBase64 ? `<img src="${mascotBase64}" class="mascot-img" />` : ''}
    </div>
  </div>
</body>
</html>`;
}

// 2. Generate Play Store Icon (512 x 512, opaque)
function buildAppIconHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${sharedStyles}
  .canvas {
    width: 512px;
    height: 512px;
    position: relative;
    background: radial-gradient(circle at 50% 30%, #0F2C59 0%, #0A192F 70%, #060E1D 100%);
    border: 14px solid #CAA025;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    text-align: center;
  }
  .crest {
    width: 250px;
    height: 250px;
    object-fit: contain;
    filter: drop-shadow(0 12px 25px rgba(202, 160, 37, 0.45));
    margin-bottom: 20px;
  }
  .brand-title {
    font-size: 34px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #FFFFFF;
    text-shadow: 0 4px 14px rgba(0,0,0,0.8);
  }
  .brand-subtitle {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #CAA025;
    margin-top: 4px;
    text-transform: uppercase;
  }
  .campus-tag {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: #94A3B8;
    margin-top: 6px;
  }
</style>
</head>
<body>
  <div class="canvas">
    ${crestBase64 ? `<img src="${crestBase64}" class="crest" />` : ''}
    <div class="brand-title">RV ALUMNI</div>
    <div class="brand-subtitle">NETWORK</div>
    <div class="campus-tag">RSST ESTD 1940</div>
  </div>
</body>
</html>`;
}

// 3. Generate Promotional Showcase Mockup Screenshots
// Dimensions: 1080 x 1920 (Android) and 1290 x 2796 (iOS)
function buildMockupScreenshotHtml(config) {
  const isIos = config.platform === 'ios';
  const width = isIos ? 1290 : 1080;
  const height = isIos ? 2796 : 1920;
  const scale = isIos ? 1.25 : 1.0;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${sharedStyles}
  .canvas {
    width: ${width}px;
    height: ${height}px;
    position: relative;
    background: linear-gradient(165deg, #071326 0%, #0A192F 40%, #0F2C59 100%);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: ${isIos ? 120 : 90}px;
  }
  .bg-glow {
    position: absolute;
    top: 5%;
    width: 80%;
    height: 500px;
    background: radial-gradient(circle, rgba(202, 160, 37, 0.14) 0%, rgba(15, 44, 89, 0) 70%);
    pointer-events: none;
  }
  .header-block {
    text-align: center;
    z-index: 10;
    padding: 0 40px;
    margin-bottom: ${isIos ? 60 : 45}px;
  }
  .header-badge {
    display: inline-block;
    background: rgba(202, 160, 37, 0.15);
    border: 1px solid #CAA025;
    color: #CAA025;
    font-size: ${Math.round(18 * scale)}px;
    font-weight: 800;
    padding: 8px 24px;
    border-radius: 30px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .header-title {
    font-size: ${Math.round(44 * scale)}px;
    font-weight: 900;
    color: #FFFFFF;
    line-height: 1.15;
    letter-spacing: -0.5px;
  }
  .header-title span {
    background: linear-gradient(135deg, #FDE68A 0%, #CAA025 60%, #B8860B 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .header-desc {
    font-size: ${Math.round(20 * scale)}px;
    color: #94A3B8;
    margin-top: 10px;
    font-weight: 500;
  }

  /* Smartphone Frame */
  .device-wrapper {
    flex: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 10;
  }
  .phone-case {
    width: ${isIos ? 980 : 860}px;
    height: ${isIos ? 2100 : 1550}px;
    background: #020617;
    border-radius: 64px 64px 0 0;
    border: 14px solid #1E293B;
    border-bottom: none;
    box-shadow: 
      0 -20px 80px rgba(0,0,0,0.8),
      inset 0 0 0 3px rgba(202, 160, 37, 0.45);
    padding: 24px 20px 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .notch-bar {
    width: 180px;
    height: 32px;
    background: #000;
    border-radius: 20px;
    margin: 0 auto 20px;
  }
  .screen-content {
    flex: 1;
    background: #F8FAFC;
    border-radius: 40px 40px 0 0;
    overflow: hidden;
    color: #0F172A;
    display: flex;
    flex-direction: column;
  }
  /* Screen Content Styles */
  .app-bar {
    background: #0A192F;
    color: #FFF;
    padding: 24px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #CAA025;
  }
  .app-bar-brand {
    font-size: ${Math.round(22 * scale)}px;
    font-weight: 800;
    color: #CAA025;
    letter-spacing: 0.5px;
  }
  .app-body {
    padding: 24px;
    flex: 1;
    background: #F1F5F9;
    overflow: hidden;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="bg-glow"></div>
    <div class="header-block">
      <div class="header-badge">${config.badge}</div>
      <div class="header-title">${config.title}</div>
      <div class="header-desc">${config.description}</div>
    </div>
    <div class="device-wrapper">
      <div class="phone-case">
        <div class="notch-bar"></div>
        <div class="screen-content">
          <div class="app-bar">
            <div class="app-bar-brand">🎓 ${config.screenTitle || 'RV ALUMNI NETWORK'}</div>
            <div style="font-size:16px;color:#CAA025;font-weight:700;">RSST ESTD 1940</div>
          </div>
          <div class="app-body">
            ${config.bodyHtml}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Content definitions for all 8 screens
const SCREEN_CONFIGS = [
  {
    id: '01_welcome',
    badge: 'Official Institutional Portal',
    title: 'WELCOME TO <span>RV ALUMNI</span>',
    description: 'Empowering 45,000+ graduates across global technology and leadership',
    screenTitle: 'RV EDUCATIONAL INSTITUTIONS',
    bodyHtml: `
      <div style="background:#0F2C59;border-radius:24px;padding:36px;color:#FFF;text-align:center;box-shadow:0 12px 30px rgba(15,44,89,0.15);">
        ${crestBase64 ? `<img src="${crestBase64}" style="width:120px;height:120px;object-fit:contain;margin-bottom:16px;" />` : ''}
        <h2 style="font-size:32px;font-weight:900;color:#CAA025;margin-bottom:8px;">RV ALUMNI NETWORK</h2>
        <p style="font-size:18px;color:#CBD5E1;margin-bottom:24px;">Connect with batchmates, mentors, and career referral opportunities.</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-bottom:30px;">
          <span style="background:rgba(202, 160, 37,0.2);color:#CAA025;border:1px solid #CAA025;padding:8px 16px;border-radius:12px;font-weight:700;font-size:16px;">RVCE</span>
          <span style="background:rgba(202, 160, 37,0.2);color:#CAA025;border:1px solid #CAA025;padding:8px 16px;border-radius:12px;font-weight:700;font-size:16px;">RVU</span>
          <span style="background:rgba(202, 160, 37,0.2);color:#CAA025;border:1px solid #CAA025;padding:8px 16px;border-radius:12px;font-weight:700;font-size:16px;">RVIM</span>
          <span style="background:rgba(202, 160, 37,0.2);color:#CAA025;border:1px solid #CAA025;padding:8px 16px;border-radius:12px;font-weight:700;font-size:16px;">RVCA</span>
        </div>
        <div style="background:#CAA025;color:#0A192F;padding:18px;border-radius:16px;font-size:20px;font-weight:900;margin-bottom:14px;">Sign in with Institutional Email</div>
        <div style="background:#000;color:#FFF;padding:18px;border-radius:16px;font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;"> Sign in with Apple</div>
      </div>
    `
  },
  {
    id: '02_feed',
    badge: 'Academic Social Community',
    title: 'CAMPUS FEED & <span>UPDATES</span>',
    description: 'Share milestones, research breakthroughs, and amplify alumni news',
    screenTitle: 'CAMPUS UPDATES & COMMUNITY',
    bodyHtml: `
      <div style="background:#FFF;border-radius:20px;padding:24px;border:1px solid #E2E8F0;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;border-radius:50%;background:#0F2C59;color:#CAA025;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;">AR</div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#0F172A;">Aditi Rao <span style="color:#CAA025;">✓</span></div>
              <div style="font-size:14px;color:#64748B;">Senior ML Engineer @ Microsoft • RVCE '17</div>
            </div>
          </div>
          <span style="background:#FAF5EB;border:1px solid #CAA025;color:#CAA025;font-weight:700;font-size:12px;padding:4px 10px;border-radius:8px;">CAREER</span>
        </div>
        <p style="font-size:18px;color:#334155;line-height:1.6;margin-bottom:16px;">Thrilled to announce that our generative AI robotics research paper was accepted at IEEE ICRA 2026! Big thanks to the robotics faculty at RVCE for sparking this journey.</p>
        <div style="display:flex;gap:24px;color:#64748B;font-size:16px;font-weight:600;border-top:1px solid #F1F5F9;padding-top:14px;">
          <span>❤️ 248 Endorsements</span>
          <span>💬 42 Comments</span>
          <span>🔄 18 Reshares</span>
        </div>
      </div>
      <div style="background:#FFF;border-radius:20px;padding:24px;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;border-radius:50%;background:#1E3A8A;color:#93C5FD;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;">KV</div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#0F172A;">Karthik Venkatesh <span style="color:#CAA025;">✓</span></div>
              <div style="font-size:14px;color:#64748B;">Founder & CEO @ FinScale • RVCE '12</div>
            </div>
          </div>
          <span style="background:#EFF6FF;color:#0F2C59;font-weight:700;font-size:12px;padding:4px 10px;border-radius:8px;">HIRING</span>
        </div>
        <p style="font-size:18px;color:#334155;line-height:1.6;">We're expanding our core engineering team! Prioritizing RV alumni for 4 backend engineering roles. Referral link below.</p>
      </div>
    `
  },
  {
    id: '03_directory',
    badge: '45,000+ Verified Members',
    title: 'GLOBAL ALUMNI <span>DIRECTORY</span>',
    description: 'Find batchmates, domain experts, and industry pioneers worldwide',
    screenTitle: 'VERIFIED ALUMNI DIRECTORY',
    bodyHtml: `
      <div style="background:#FFF;border-radius:16px;padding:16px 20px;border:1px solid #CBD5E1;display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <span style="font-size:20px;">🔍</span>
        <span style="color:#64748B;font-size:18px;">Search by name, company, batch, or domain...</span>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:20px;overflow:hidden;">
        <span style="background:#0F2C59;color:#FFF;padding:8px 16px;border-radius:10px;font-weight:700;font-size:14px;">All Batches</span>
        <span style="background:#FFF;color:#334155;border:1px solid #CBD5E1;padding:8px 16px;border-radius:10px;font-weight:600;font-size:14px;">Bengaluru</span>
        <span style="background:#FFF;color:#334155;border:1px solid #CBD5E1;padding:8px 16px;border-radius:10px;font-weight:600;font-size:14px;">Bay Area</span>
        <span style="background:#FFF;color:#334155;border:1px solid #CBD5E1;padding:8px 16px;border-radius:10px;font-weight:600;font-size:14px;">London</span>
      </div>
      <div style="background:#FFF;border-radius:20px;padding:22px;border:1px solid #E2E8F0;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;align-items:center;">
          <div style="width:60px;height:60px;border-radius:50%;background:#0A192F;color:#CAA025;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;">SM</div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#0F172A;">Siddharth Menon <span style="color:#CAA025;">✓</span></div>
            <div style="font-size:15px;color:#334155;font-weight:600;">Staff Software Engineer @ Google</div>
            <div style="font-size:13px;color:#64748B;">B.E. Computer Science • Batch of 2015</div>
          </div>
        </div>
        <div style="background:#0F2C59;color:#FFF;padding:10px 18px;border-radius:12px;font-weight:700;font-size:14px;">Connect</div>
      </div>
      <div style="background:#FFF;border-radius:20px;padding:22px;border:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;align-items:center;">
          <div style="width:60px;height:60px;border-radius:50%;background:#3B82F6;color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;">PK</div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#0F172A;">Priya Kulkarni <span style="color:#CAA025;">✓</span></div>
            <div style="font-size:15px;color:#334155;font-weight:600;">Director of Product @ Atlassian</div>
            <div style="font-size:13px;color:#64748B;">B.E. Electronics & Communication • Batch of 2011</div>
          </div>
        </div>
        <div style="background:#0F2C59;color:#FFF;padding:10px 18px;border-radius:12px;font-weight:700;font-size:14px;">Connect</div>
      </div>
    `
  },
  {
    id: '04_jobs',
    badge: 'Direct Alumni Referrals',
    title: 'CAREER & <span>REFERRAL HUB</span>',
    description: 'Access exclusive job openings and direct employee referral links',
    screenTitle: 'CAREER & JOB REFERRALS',
    bodyHtml: `
      <div style="background:#FFF;border-radius:20px;padding:26px;border:1px solid #E2E8F0;margin-bottom:20px;border-left:5px solid #CAA025;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <span style="background:#FEF3C7;color:#92400E;font-size:12px;font-weight:800;padding:4px 10px;border-radius:6px;">HOT REFERRAL</span>
            <h3 style="font-size:22px;font-weight:900;color:#0F172A;margin-top:6px;">Staff Full Stack Engineer</h3>
            <div style="font-size:16px;color:#475569;font-weight:600;">Atlassian • Bengaluru (Hybrid)</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:900;color:#0F2C59;">₹38 - 55 LPA</div>
            <div style="font-size:13px;color:#64748B;">Full Time</div>
          </div>
        </div>
        <p style="font-size:15px;color:#475569;line-height:1.5;margin-bottom:16px;">Leading design and architecture of high-scale cloud collaboration microservices. Mentored by RVCE alum inside team.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:13px;color:#64748B;">Posted by <strong>Vikram Rao ('16)</strong></div>
          <div style="background:#CAA025;color:#0A192F;padding:12px 24px;border-radius:12px;font-weight:900;font-size:15px;">Request Referral</div>
        </div>
      </div>
      <div style="background:#FFF;border-radius:20px;padding:26px;border:1px solid #E2E8F0;border-left:5px solid #0F2C59;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <span style="background:#EFF6FF;color:#1E40AF;font-size:12px;font-weight:800;padding:4px 10px;border-radius:6px;">ALUMNI VENTURE</span>
            <h3 style="font-size:22px;font-weight:900;color:#0F172A;margin-top:6px;">Lead ML Research Scientist</h3>
            <div style="font-size:16px;color:#475569;font-weight:600;">Stealth AI Labs • San Francisco / Remote</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:900;color:#0F2C59;">$180k - $240k</div>
            <div style="font-size:13px;color:#64748B;">Equity Included</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
          <div style="font-size:13px;color:#64748B;">Posted by <strong>Dr. Ananya Sen ('10)</strong></div>
          <div style="background:#0F2C59;color:#FFF;padding:12px 24px;border-radius:12px;font-weight:800;font-size:15px;">Apply with Profile</div>
        </div>
      </div>
    `
  },
  {
    id: '05_mentorship',
    badge: '1-on-1 Guidance',
    title: 'EXECUTIVE <span>MENTORSHIP</span>',
    description: 'Book sessions with senior leaders, venture founders, and PhD scholars',
    screenTitle: 'ALUMNI MENTORSHIP HUB',
    bodyHtml: `
      <div style="background:#FFF;border-radius:20px;padding:24px;border:1px solid #E2E8F0;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="display:flex;gap:18px;align-items:center;margin-bottom:16px;">
          <div style="width:68px;height:68px;border-radius:50%;background:#0A192F;border:2px solid #CAA025;color:#CAA025;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;">RN</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:#0F172A;">Rohan Nambiar <span style="color:#CAA025;">✓</span></div>
            <div style="font-size:15px;color:#0F2C59;font-weight:700;">VP of Engineering @ Stripe • RVCE '08</div>
            <div style="font-size:13px;color:#64748B;">Specialization: Distributed Systems & Engineering Leadership</div>
          </div>
        </div>
        <div style="background:#F8FAFC;border-radius:14px;padding:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14px;color:#334155;font-weight:600;">Next Slot: Saturday, 10:30 AM IST</span>
          <span style="color:#16A34A;font-weight:800;font-size:14px;">Available</span>
        </div>
        <div style="background:#0F2C59;color:#FFF;text-align:center;padding:14px;border-radius:12px;font-weight:800;font-size:16px;">Book 1-on-1 Mentorship Call</div>
      </div>
      <div style="background:#FFF;border-radius:20px;padding:24px;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="display:flex;gap:18px;align-items:center;margin-bottom:16px;">
          <div style="width:68px;height:68px;border-radius:50%;background:#CAA025;color:#0A192F;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;">MG</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:#0F172A;">Dr. Meera Gokhale <span style="color:#CAA025;">✓</span></div>
            <div style="font-size:15px;color:#0F2C59;font-weight:700;">Postdoctoral Fellow @ Stanford University</div>
            <div style="font-size:13px;color:#64748B;">Specialization: Higher Studies Abroad & MS/PhD Admissions</div>
          </div>
        </div>
        <div style="background:#0F2C59;color:#FFF;text-align:center;padding:14px;border-radius:12px;font-weight:800;font-size:16px;">Book 1-on-1 Mentorship Call</div>
      </div>
    `
  },
  {
    id: '06_events',
    badge: 'Reunions & Conclaves',
    title: 'EVENTS & <span>DIGITAL PASS</span>',
    description: 'Instant QR access for campus festivals, batch jubilees, and tech talks',
    screenTitle: 'EVENTS & INSTITUTION PASSES',
    bodyHtml: `
      <div style="background:#0F2C59;border-radius:22px;padding:26px;color:#FFF;margin-bottom:20px;box-shadow:0 12px 30px rgba(15,44,89,0.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="background:rgba(202, 160, 37,0.2);color:#CAA025;border:1px solid #CAA025;padding:4px 12px;border-radius:8px;font-weight:800;font-size:12px;">OFFICIAL CONCLAVE</span>
          <span style="color:#93C5FD;font-weight:700;font-size:14px;">RSST Auditorium</span>
        </div>
        <h3 style="font-size:24px;font-weight:900;color:#FFF;margin-bottom:8px;">RV Global Alumni Conclave 2026</h3>
        <p style="font-size:15px;color:#CBD5E1;line-height:1.5;margin-bottom:20px;">Celebrating 85 years of RSST legacy with 2,000+ alumni, keynote addresses by prominent industry leaders, and evening networking gala dinner.</p>
        <div style="background:#FFF;border-radius:16px;padding:18px;color:#0F172A;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:12px;color:#64748B;font-weight:700;">ATTENDEE PASS VERIFIED</div>
            <div style="font-size:18px;font-weight:900;color:#0F2C59;">VIP All-Access Pass</div>
            <div style="font-size:12px;color:#CAA025;font-weight:800;">ID: RVAC-2026-8942</div>
          </div>
          <div style="width:70px;height:70px;background:#0A192F;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#CAA025;font-size:28px;">🔲</div>
        </div>
      </div>
    `
  },
  {
    id: '07_chat',
    badge: 'End-to-End Encrypted',
    title: 'REAL-TIME <span>MESSAGING</span>',
    description: 'Instant direct chat with batchmates, mentors, and affinity groups',
    screenTitle: 'MESSAGES & CHANNELS',
    bodyHtml: `
      <div style="background:#FFF;border-radius:20px;padding:22px;border:1px solid #E2E8F0;margin-bottom:16px;">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:18px;border-bottom:1px solid #F1F5F9;padding-bottom:14px;">
          <div style="width:52px;height:52px;border-radius:50%;background:#0F2C59;color:#CAA025;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;">VK</div>
          <div>
            <div style="font-size:18px;font-weight:800;color:#0F172A;">Vivek Kumar (Batch '18)</div>
            <div style="font-size:13px;color:#16A34A;font-weight:600;">● Online • RVCE CSE</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="align-self:flex-start;background:#F1F5F9;border-radius:16px 16px 16px 4px;padding:14px 18px;max-width:80%;font-size:16px;color:#1E293B;">
            Hey Rahul! Are you attending the alumni conclave this Saturday?
          </div>
          <div style="align-self:flex-end;background:#0F2C59;color:#FFF;border-radius:16px 16px 4px 16px;padding:14px 18px;max-width:80%;font-size:16px;">
            Yes, absolutely! Already got my QR pass. Looking forward to meeting everyone at the campus dinner.
          </div>
          <div style="align-self:flex-start;background:#F1F5F9;border-radius:16px 16px 16px 4px;padding:14px 18px;max-width:80%;font-size:16px;color:#1E293B;">
            Awesome! Also wanted to ask if your team is still looking for senior backend engineers?
          </div>
        </div>
      </div>
    `
  },
  {
    id: '08_profile',
    badge: 'Digital Alumni Identity',
    title: 'VERIFIED <span>CREDENTIALS</span>',
    description: 'Showcase institutional pedigree, endorsed skills, and achievements',
    screenTitle: 'ALUMNI IDENTITY PROFILE',
    bodyHtml: `
      <div style="background:#FFF;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="height:120px;background:linear-gradient(135deg, #0A192F 0%, #0F2C59 100%);position:relative;padding:16px;">
          <span style="background:rgba(202, 160, 37,0.2);color:#CAA025;border:1px solid #CAA025;padding:4px 10px;border-radius:8px;font-weight:800;font-size:12px;">VERIFIED ALUMNUS</span>
        </div>
        <div style="padding:0 24px 24px;position:relative;top:-45px;">
          <div style="width:90px;height:90px;border-radius:50%;background:#0A192F;border:4px solid #FFF;color:#CAA025;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:32px;margin-bottom:14px;box-shadow:0 6px 16px rgba(0,0,0,0.15);">RS</div>
          <h2 style="font-size:26px;font-weight:900;color:#0F172A;">Rahul Sharma</h2>
          <div style="font-size:16px;color:#0F2C59;font-weight:700;">Principal Architect @ CloudScale Solutions</div>
          <div style="font-size:14px;color:#64748B;margin-top:2px;">B.E. Computer Science & Engineering • Batch of 2018 (RVCE)</div>
          <div style="display:flex;gap:24px;margin:18px 0;border-top:1px solid #F1F5F9;border-bottom:1px solid #F1F5F9;padding:14px 0;">
            <div><strong style="color:#0F2C59;font-size:18px;">1,420</strong> <span style="color:#64748B;font-size:14px;">Connections</span></div>
            <div><strong style="color:#0F2C59;font-size:18px;">38</strong> <span style="color:#64748B;font-size:14px;">Endorsements</span></div>
            <div><strong style="color:#0F2C59;font-size:18px;">12</strong> <span style="color:#64748B;font-size:14px;">Mentorships</span></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="background:#F1F5F9;color:#334155;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;">Cloud Architecture</span>
            <span style="background:#F1F5F9;color:#334155;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;">Kubernetes</span>
            <span style="background:#F1F5F9;color:#334155;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;">Distributed Systems</span>
          </div>
        </div>
      </div>
    `
  }
];

// Helper to run headless Chrome screenshot
function captureScreenshot(htmlPath, outPngPath, width, height) {
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  const cmd = `Start-Process "${CHROME_PATH}" -ArgumentList "--headless=new", "--hide-scrollbars", "--disable-gpu", "--screenshot=\`"${outPngPath}\`"", "--window-size=${width},${height}", "${fileUrl}" -Wait`;
  execSync(`powershell -Command "${cmd.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
}

async function main() {
  console.log('====================================================');
  console.log(' GENERATING OFFICIAL APP STORE & PLAY STORE ASSETS');
  console.log('====================================================\n');

  // 1. Google Play Feature Graphic (1024 x 500)
  console.log('1. Generating Feature Graphic (1024 x 500)...');
  const fgHtmlPath = path.join(TEMP_DIR, 'feature_graphic.html');
  const fgPngPath = path.join(STORE_ASSETS_DIR, 'feature_graphic.png');
  fs.writeFileSync(fgHtmlPath, buildFeatureGraphicHtml(), 'utf8');
  captureScreenshot(fgHtmlPath, fgPngPath, 1024, 500);
  console.log('   ✓ Saved to store-assets/feature_graphic.png\n');

  // 2. Google Play App Icon (512 x 512)
  console.log('2. Generating Play Store Icon (512 x 512)...');
  const iconHtmlPath = path.join(TEMP_DIR, 'play_store_icon.html');
  const iconPngPath = path.join(STORE_ASSETS_DIR, 'play_store_icon.png');
  fs.writeFileSync(iconHtmlPath, buildAppIconHtml(), 'utf8');
  captureScreenshot(iconHtmlPath, iconPngPath, 512, 512);
  console.log('   ✓ Saved to store-assets/play_store_icon.png\n');

  // 3. Android Screenshots (1080 x 1920)
  console.log('3. Generating 8 Google Play Screenshots (1080 x 1920)...');
  for (const cfg of SCREEN_CONFIGS) {
    const html = buildMockupScreenshotHtml({ ...cfg, platform: 'android' });
    const htmlPath = path.join(TEMP_DIR, `android_${cfg.id}.html`);
    const pngPath = path.join(STORE_ASSETS_DIR, `android_${cfg.id}.png`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    captureScreenshot(htmlPath, pngPath, 1080, 1920);
    console.log(`   ✓ Saved store-assets/android_${cfg.id}.png`);
  }
  console.log('');

  // 4. iOS Screenshots (1290 x 2796)
  console.log('4. Generating 6 Apple App Store 6.7" Screenshots (1290 x 2796)...');
  for (let i = 0; i < 6; i++) {
    const cfg = SCREEN_CONFIGS[i];
    const html = buildMockupScreenshotHtml({ ...cfg, platform: 'ios' });
    const htmlPath = path.join(TEMP_DIR, `ios_6.7_${cfg.id}.html`);
    const pngPath = path.join(STORE_ASSETS_DIR, `ios_6.7_${cfg.id}.png`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    captureScreenshot(htmlPath, pngPath, 1290, 2796);
    console.log(`   ✓ Saved store-assets/ios_6.7_${cfg.id}.png`);
  }
  console.log('');

  // Clean up temporary HTML files
  console.log('Cleaning up temporary HTML files...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log('✓ Cleanup done.\n');

  console.log('====================================================');
  console.log(' ALL VISUAL STORE ASSETS GENERATED SUCCESSFULLY!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Asset Generation Error:', err);
  process.exit(1);
});
