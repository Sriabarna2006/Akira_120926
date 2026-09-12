import { runNeonMigrations, checkNeonConnection } from './neon.js';

async function main() {
  console.log('Connecting to Neon DB...');
  const health = await checkNeonConnection();
  console.log('Neon Connection Status:', health);

  if (health.isConnected) {
    console.log('Applying Neon schema migrations & seed data...');
    const result = await runNeonMigrations();
    console.log('Migration Result:', result);
  } else {
    console.error('Failed to connect to Neon DB:', health.message);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
