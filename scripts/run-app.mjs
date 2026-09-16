import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

// One supervisor owns both services. A failed service shuts down its peer so
// the process manager can restart the complete application.
export function runProcesses(commands, env = process.env) {
  return new Promise((resolve) => {
    const children = new Set();
    const groups = new Set();
    const detached = process.platform !== "win32";
    let stopping = false;
    let exitCode = 0;
    let deadline;

    function signalGroup(child, signal) {
      try {
        if (detached && child.pid) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch (error) {
        if (error.code !== "ESRCH") console.error("Process cleanup failed", error.code);
      }
    }
    function finish() {
      clearTimeout(deadline);
      // Also remove subprocesses left behind by a service that exited early.
      for (const child of groups) signalGroup(child, "SIGKILL");
      process.off("SIGINT", onInterrupt);
      process.off("SIGTERM", onTerminate);
      resolve(exitCode);
    }
    function stop(code) {
      if (stopping) return;
      stopping = true;
      exitCode = code;
      for (const child of children) {
        if (child.drain) child.kill("SIGTERM");
        else signalGroup(child, "SIGTERM");
      }
      if (!children.size) { finish(); return; }
      deadline = setTimeout(() => {
        for (const child of groups) signalGroup(child, "SIGKILL");
      }, 120_000);
    }
    const onInterrupt = () => stop(130);
    const onTerminate = () => stop(143);
    process.on("SIGINT", onInterrupt);
    process.on("SIGTERM", onTerminate);

    for (const command of commands) {
      const child = spawn(process.execPath, command.args, {
        stdio: "inherit", env, detached,
      });
      child.drain = command.drain;
      children.add(child);
      groups.add(child);
      child.once("error", () => {
        console.error(`${command.name} failed to start`);
        stop(1);
      });
      child.once("close", (code, signal) => {
        children.delete(child);
        if (!stopping) {
          console.error(`${command.name} exited (${signal ?? code}); stopping application`);
          stop(code || 1);
        } else if (!children.size) finish();
      });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode !== "dev" && mode !== "start") {
    console.error("Usage: node scripts/run-app.mjs <dev|start> [Next.js arguments]");
    process.exitCode = 1;
  } else {
    const nextArgs = args[0] === "--" ? args.slice(1) : args;
    process.exitCode = await runProcesses([
      { name: "web", args: [require.resolve("next/dist/bin/next"), mode, ...nextArgs] },
      { name: "media worker", args: ["--import", "tsx", "scripts/video-worker.ts"], drain: true },
    ], { ...process.env, NODE_ENV: mode === "dev" ? "development" : "production" });
  }
}
