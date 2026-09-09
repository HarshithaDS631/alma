const https = require('https');

const query = JSON.stringify({
  query: `
    query GetBuild($id: String!) {
      builds {
        byId(buildId: $id) {
          id
          status
          error {
            message
            errorCode
          }
          logUrl
        }
      }
    }
  `,
  variables: { id: '3d7ea8d0-8572-4e06-9009-057691e8f909' }
});

const req = https.request({
  hostname: 'api.expo.dev',
  path: '/--/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 5ZzwWjRprY-KytjDGWt5a_F33SuupVxF5i9BMQj0',
    'Content-Length': Buffer.byteLength(query)
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('GraphQL response:', data));
});
req.write(query);
req.end();
