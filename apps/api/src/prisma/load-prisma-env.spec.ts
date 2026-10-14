jest.mock('dotenv', () => ({ config: jest.fn(() => ({ parsed: {} })) }));
jest.mock('dotenv-expand', () => ({ expand: jest.fn() }));

describe('Prisma environment loading', () => {
  const previous = process.env.OPENAPI_EXPORT;

  afterEach(() => {
    if (previous === undefined) delete process.env.OPENAPI_EXPORT;
    else process.env.OPENAPI_EXPORT = previous;
  });

  it.each([false, true])(
    'loads private files only outside export mode (%s)',
    async (exporting) => {
      jest.resetModules();
      if (exporting) process.env.OPENAPI_EXPORT = 'true';
      else delete process.env.OPENAPI_EXPORT;
      const { config } = await import('dotenv');
      const { expand } = await import('dotenv-expand');
      await import('./load-prisma-env');
      expect(config).toHaveBeenCalledTimes(exporting ? 0 : 1);
      expect(expand).toHaveBeenCalledTimes(exporting ? 0 : 1);
    },
  );
});
