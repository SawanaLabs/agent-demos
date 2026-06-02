import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const webDir = path.join(repoRoot, "apps/web");
const buildIdPath = path.join(webDir, ".next/BUILD_ID");
const demoPagesDir = path.join(webDir, "app/demos");
const lineBreakPattern = /\r?\n/;
// biome-ignore lint/style/noProcessEnv: this Node CLI is configured through command environment variables.
const runtimeEnv = process.env;
const defaultPort = Number(runtimeEnv.DEMO_SMOKE_PORT || 4300);
const defaultTimeoutMs = Number(runtimeEnv.DEMO_SMOKE_TIMEOUT_MS || 30_000);
const verbose = runtimeEnv.DEMO_SMOKE_VERBOSE === "1";

const gatewayMissingNeedles = [
  "AI_GATEWAY_API_KEY is missing",
  "Missing AI_GATEWAY_API_KEY",
];

const readyRoutes = new Set([
  "/demos/foundation-chat",
  "/demos/openai-agents-sdk-demo",
]);

function readDemoRoutes() {
  return fs
    .readdirSync(demoPagesDir)
    .filter((name) => fs.existsSync(path.join(demoPagesDir, name, "page.tsx")))
    .sort()
    .map((name) => `/demos/${name}`);
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(
    `Could not find an available port from ${startPort} to ${startPort + 99}.`
  );
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

function createSmokeEnv() {
  return {
    ...runtimeEnv,
    NODE_ENV: "production",
    AI_GATEWAY_API_KEY:
      runtimeEnv.AI_GATEWAY_API_KEY || "demo-smoke-ai-gateway-key",
    AI_GATEWAY_BASE_URL:
      runtimeEnv.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v3/ai",
    AI_GATEWAY_CHAT_MODEL:
      runtimeEnv.AI_GATEWAY_CHAT_MODEL || "openai/gpt-5-mini",
    AI_GATEWAY_EMBEDDING_MODEL:
      runtimeEnv.AI_GATEWAY_EMBEDDING_MODEL || "openai/text-embedding-3-small",
  };
}

function appendLog(log, chunk) {
  log.push(...String(chunk).split(lineBreakPattern).filter(Boolean));
  log.splice(0, Math.max(0, log.length - 80));
}

function startProductionServer(port) {
  if (!fs.existsSync(buildIdPath)) {
    throw new Error(
      "Missing apps/web/.next/BUILD_ID. Run `pnpm build` before `pnpm smoke:demos:production`."
    );
  }

  const log = [];
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], {
    cwd: webDir,
    env: createSmokeEnv(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    appendLog(log, chunk);
    if (verbose) {
      process.stdout.write(chunk);
    }
  });
  child.stderr.on("data", (chunk) => {
    appendLog(log, chunk);
    if (verbose) {
      process.stderr.write(chunk);
    }
  });

  return { child, log };
}

async function stopProductionServer(server) {
  if (!server || server.child.exitCode !== null) {
    return;
  }

  server.child.kill("SIGTERM");

  const timeout = delay(5000).then(() => {
    if (server.child.exitCode === null) {
      server.child.kill("SIGKILL");
    }
  });

  await Promise.race([once(server.child, "exit"), timeout]);
}

async function waitForServer(baseUrl, server) {
  const deadline = Date.now() + defaultTimeoutMs;
  let lastError = "server did not respond";

  while (Date.now() < deadline) {
    if (server?.child.exitCode !== null) {
      throw new Error(
        `Production server exited before smoke checks started.\n${server.log.join("\n")}`
      );
    }

    try {
      const response = await fetch(baseUrl, {
        signal: AbortSignal.timeout(2000),
      });
      await response.arrayBuffer();
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await delay(250);
    }
  }

  throw new Error(
    `Timed out waiting for production server at ${baseUrl}: ${lastError}\n${server?.log.join("\n") ?? ""}`
  );
}

async function fetchRoute(baseUrl, route) {
  const response = await fetch(new URL(route, baseUrl), {
    signal: AbortSignal.timeout(defaultTimeoutMs),
  });
  const html = await response.text();
  const gatewayMissingNeedle = gatewayMissingNeedles.find((needle) =>
    html.includes(needle)
  );

  return {
    route,
    status: response.status,
    bytes: html.length,
    cacheControl: response.headers.get("cache-control"),
    gatewayMissingNeedle,
    hasReady: html.includes("Ready"),
  };
}

function buildFailures(results) {
  const failures = [];

  for (const result of results) {
    if (result.status !== 200) {
      failures.push(`${result.route} returned HTTP ${result.status}.`);
    }

    if (result.gatewayMissingNeedle) {
      failures.push(
        `${result.route} rendered gateway setup text: ${result.gatewayMissingNeedle}`
      );
    }

    if (readyRoutes.has(result.route) && !result.hasReady) {
      failures.push(`${result.route} did not render the Ready state.`);
    }
  }

  const foundationChat = results.find(
    (result) => result.route === "/demos/foundation-chat"
  );

  if (foundationChat && !foundationChat.cacheControl?.includes("no-store")) {
    failures.push(
      "/demos/foundation-chat did not return a no-store production response."
    );
  }

  return failures;
}

async function main() {
  const providedBaseUrl = runtimeEnv.DEMO_SMOKE_BASE_URL;
  let server;
  let baseUrl;

  if (providedBaseUrl) {
    baseUrl = normalizeBaseUrl(providedBaseUrl);
  } else {
    const port = await findAvailablePort(defaultPort);
    baseUrl = `http://127.0.0.1:${port}/`;
    server = startProductionServer(port);
    await waitForServer(baseUrl, server);
  }

  try {
    const routes = readDemoRoutes();
    const results = [];

    for (const route of routes) {
      results.push(await fetchRoute(baseUrl, route));
    }

    const failures = buildFailures(results);

    for (const result of results) {
      console.log(
        JSON.stringify({
          route: result.route,
          status: result.status,
          bytes: result.bytes,
          hasReady: result.hasReady,
          hasGatewayMissingMessage: Boolean(result.gatewayMissingNeedle),
        })
      );
    }

    if (failures.length > 0) {
      throw new Error(
        `Production demo smoke failed against ${baseUrl}\n${failures.join("\n")}`
      );
    }

    console.log(
      `Production demo smoke passed for ${results.length} routes at ${baseUrl}`
    );
  } finally {
    await stopProductionServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
