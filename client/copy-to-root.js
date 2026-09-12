import fs from 'fs';
import path from 'path';

const clientDist = path.resolve('dist');
const rootDist = path.resolve('../dist');

try {
  if (fs.existsSync(clientDist)) {
    if (!fs.existsSync(rootDist)) {
      fs.mkdirSync(rootDist, { recursive: true });
    }
    fs.cpSync(clientDist, rootDist, { recursive: true, force: true });
    console.log('✓ Synced client/dist -> ../dist');
  }
} catch (e) {
  // ignore if in isolated container
}
