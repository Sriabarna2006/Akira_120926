import fs from 'fs';
import path from 'path';

const clientDist = path.resolve('client/dist');
const rootDist = path.resolve('dist');

if (fs.existsSync(clientDist)) {
  fs.cpSync(clientDist, rootDist, { recursive: true, force: true });
  console.log('✓ Successfully synced client/dist -> ./dist');
}
