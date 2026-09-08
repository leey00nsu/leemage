import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runProcesses } from "./run-app.mjs";

const directory = await mkdtemp(join(tmpdir(), "leemage-supervisor-"));
const marker = join(directory, "stopped");
const worker = {
  name: "test worker", drain: true,
  args: ["-e", `process.on('SIGTERM', () => { require('fs').writeFileSync(${JSON.stringify(marker)}, 'drained'); process.exit(0); }); setInterval(() => {}, 1000);`],
};
try {
  const failure = await runProcesses([
    worker,
    { name: "test web", args: ["-e", "setTimeout(() => process.exit(23), 500)"] },
  ]);
  assert.equal(failure, 23);
  assert.equal(await readFile(marker, "utf8"), "drained");
  await rm(marker);
  const interrupt = setTimeout(() => process.emit("SIGTERM"), 500);
  const stopped = await runProcesses([worker, { name: "test web", args: ["-e", "setInterval(() => {}, 1000)"] }]);
  clearTimeout(interrupt);
  assert.equal(stopped, 143);
  assert.equal(await readFile(marker, "utf8"), "drained");
  console.info("PASS: service failure stops its peer; SIGTERM drains the worker and stops web");
} finally { await rm(directory, { recursive: true, force: true }); }
