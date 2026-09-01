import { spawn } from "node:child_process";

import { startMockBackend } from "./support/mock-backend.mjs";

const backend = await startMockBackend(4011);
const next = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1"], {
  env: {
    ...process.env,
    API_BASE_URL: "http://127.0.0.1:4011/api/v2",
    CIS_API_KEY: "fixture-cis-key",
  },
  stdio: "inherit",
});

async function shutdown(signal) {
  next.kill(signal);
  await new Promise((resolve) => backend.close(resolve));
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
next.on("exit", async (code) => {
  await new Promise((resolve) => backend.close(resolve));
  process.exit(code ?? 0);
});
