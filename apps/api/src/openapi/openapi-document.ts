import { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createSwaggerDocument } from '../configs/swagger.config';

/** Read the real module graph without constructors, lifecycle hooks or listeners. */
export async function generateOpenApiDocument(rootModule: Type<unknown>) {
  const app = await NestFactory.create(rootModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });
  try {
    return createSwaggerDocument(app);
  } finally {
    await app.close();
  }
}
