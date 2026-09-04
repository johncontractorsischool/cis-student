import { spawn } from "node:child_process";

import { startMockBackend } from "./support/mock-backend.mjs";

const appPort = process.env.E2E_APP_PORT || "3100";
const backendPort = Number(process.env.E2E_BACKEND_PORT || "4111");
const backend = await startMockBackend(backendPort);
const next = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", appPort], {
  env: {
    ...process.env,
    API_BASE_URL: `http://127.0.0.1:${backendPort}/api/v2`,
    CIS_API_KEY: "fixture-cis-key",
    E2E_BACKEND_PORT: String(backendPort),
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
