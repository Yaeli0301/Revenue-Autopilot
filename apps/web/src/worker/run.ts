import { startWorkers } from "./index";

let shutdown: (() => Promise<void>) | null = null;

async function main() {
  shutdown = await startWorkers();

  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
}

async function gracefulShutdown(signal: string) {
  console.log(`[worker] ${signal} received, shutting down...`);
  if (shutdown) await shutdown();
  process.exit(0);
}

main().catch((err) => {
  console.error("[worker] fatal error:", err);
  process.exit(1);
});
