import { createEnv } from "@t3-oss/env-nextjs";

import { keys as aiGateway } from "@/features/shared/ai-gateway/server/keys";

export const env = createEnv({
  extends: [aiGateway()],
  server: {},
  client: {},
  runtimeEnv: {},
});
