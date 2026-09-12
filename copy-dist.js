import fs from 'fs';
import path from 'path';

const rootDist = path.resolve('dist');
const clientDist = path.resolve('client/dist');

// Ensure dist exists at root
if (fs.existsSync(clientDist) && !fs.existsSync(rootDist)) {
  fs.mkdirSync(rootDist, { recursive: true });
  fs.cpSync(clientDist, rootDist, { recursive: true, force: true });
  console.log('✓ Synced client/dist -> ./dist');
} else if (fs.existsSync(rootDist) && !fs.existsSync(clientDist)) {
  fs.mkdirSync(clientDist, { recursive: true });
  fs.cpSync(rootDist, clientDist, { recursive: true, force: true });
  console.log('✓ Synced ./dist -> client/dist');
}
