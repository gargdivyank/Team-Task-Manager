import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { assertJwtConfigured } from './middleware/auth.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  assertJwtConfigured();
  await connectDb();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
