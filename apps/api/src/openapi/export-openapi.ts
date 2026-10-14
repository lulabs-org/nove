import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateOpenApiDocument } from './openapi-document';

async function main() {
  // Set before importing AppModule so ConfigModule never loads private .env files.
  process.env.OPENAPI_EXPORT = 'true';
  const { AppModule } = await import('../app.module');
  const document = await generateOpenApiDocument(AppModule);
  const output = resolve(process.argv[2] || 'openapi/openapi.json');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(document, null, 2) + '\n');
  console.log(
    `Exported ${Object.keys(document.paths).length} OpenAPI paths to ${output}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
