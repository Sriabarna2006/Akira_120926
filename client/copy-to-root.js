import fs from 'fs';
import path from 'path';

const clientDist = path.resolve('dist');
const rootDist = path.resolve('../dist');

if (fs.existsSync(clientDist)) {
  try {
    fs.cpSync(clientDist, rootDist, { recursive: true, force: true });
    console.log('✓ Successfully synced client/dist -> ../dist');
  } catch (e) {
    // Ignore error if in restricted container
  }
}
