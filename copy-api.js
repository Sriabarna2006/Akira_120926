import fs from 'fs';
import path from 'path';

const src = path.resolve('api/index.js');
const dest = path.resolve('api/[...all].js');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✓ Successfully created api/[...all].js catch-all serverless function');

  const clientApiDir = path.resolve('client/api');
  if (!fs.existsSync(clientApiDir)) {
    fs.mkdirSync(clientApiDir, { recursive: true });
  }
  fs.copyFileSync(src, path.join(clientApiDir, 'index.js'));
  fs.copyFileSync(src, path.join(clientApiDir, '[...all].js'));
  console.log('✓ Successfully synced serverless functions to client/api/');
}
