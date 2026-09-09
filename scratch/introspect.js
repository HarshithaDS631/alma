const https = require('https');

const query = JSON.stringify({
  query: `
    query IntrospectionQuery {
      __type(name: "RootMutation") {
        name
        fields {
          name
          args {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  `
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
    try {
      const json = JSON.parse(data);
      const fields = json.data?.__type?.fields || [];
      const authFields = fields.filter(f => f.name.toLowerCase().includes('auth') || f.name.toLowerCase().includes('login') || f.name.toLowerCase().includes('user') || f.name.toLowerCase().includes('session') || f.name.toLowerCase().includes('token'));
      console.log('Auth fields:', authFields.map(f => f.name));
    } catch(e) {
      console.log('Error:', e.message, data);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(query);
req.end();
