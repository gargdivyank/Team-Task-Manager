import 'dotenv/config';
import { createApp } from '../src/app.js';
import { assertJwtConfigured } from '../src/middleware/auth.js';

assertJwtConfigured();

const app = createApp();
export default app;
