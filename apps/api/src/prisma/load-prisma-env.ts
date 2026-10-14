import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

// Preserve Prisma 6 .env interpolation without overriding injected variables.
if (process.env.OPENAPI_EXPORT !== 'true') {
  expand(config({ quiet: true }));
}
