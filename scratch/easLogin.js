const { spawn } = require('child_process');

const email = 'rveducational@gmail.com';
const pass = 'ComicCon@RV$#))7';

console.log('[EAS LOGIN] Logging in with --no-browser for', email);

const child = spawn('cmd.exe', ['/c', 'eas', 'login', '--no-browser'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  console.log('[STDOUT]', str);
  if (str.includes('Email') || str.includes('username') || str.includes('Input is required')) {
    child.stdin.write(email + '\n');
  }
  if (str.includes('Password')) {
    child.stdin.write(pass + '\n');
  }
});

child.stderr.on('data', (data) => {
  console.log('[STDERR]', data.toString());
});

// Also send input sequentially after delays to ensure prompt capture
setTimeout(() => {
  child.stdin.write(email + '\n');
}, 1500);

setTimeout(() => {
  child.stdin.write(pass + '\n');
}, 3500);

child.on('close', (code) => {
  console.log('[EAS LOGIN] Finished with code:', code);
});
