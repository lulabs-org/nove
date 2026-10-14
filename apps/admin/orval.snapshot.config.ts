import { defineConfig } from 'orval';
import { clientConfig } from './orval.config';

// Clean installs must not depend on a running API or a developer's environment.
export default defineConfig({
  noveApi: {
    ...clientConfig.noveApi,
    input: { target: './openapi.snapshot.json' },
  },
});
