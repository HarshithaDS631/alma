const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const query = JSON.stringify({
  query: `
    mutation LoginMutation($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        __typename
        ... on UserData {
          id
          username
          sessionSecret
        }
        ... on SSOUser {
          id
          username
          sessionSecret
        }
      }
    }
  `,
  variables: {
    username: 'rveducational@gmail.com',
    password: 'ComicCon@RV$#))7'
  }
});

const req = https.request('https://api.expo.dev/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(query),
    'User-Agent': 'eas-cli/21.7.0'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      const user = json.data?.login;
      if (user?.sessionSecret) {
        const expoDir = path.join(os.homedir(), '.expo');
        if (!fs.existsSync(expoDir)) fs.mkdirSync(expoDir, { recursive: true });
        const statePath = path.join(expoDir, 'state.json');
        let state = {};
        if (fs.existsSync(statePath)) {
          try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch(e){}
        }
        state.auth = {
          sessionSecret: user.sessionSecret,
          userId: user.id,
          username: user.username
        };
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        console.log('Successfully saved session to ~/.expo/state.json for user:', user.username);
      }
    } catch(e) {
      console.log('Parse err:', e.message);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(query);
req.end();
