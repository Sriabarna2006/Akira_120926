import fs from 'fs';
import path from 'path';

const src = path.resolve('api/index.js');
const dest = path.resolve('api/[...all].js');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✓ Successfully created api/[...all].js catch-all serverless function');
}
