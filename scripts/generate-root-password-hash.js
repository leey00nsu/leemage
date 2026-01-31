#!/usr/bin/env node
const bcrypt = require("bcryptjs");
const { stdin, stdout, argv, exit } = process;

const DEFAULT_ROUNDS = 12;

function printHelp() {
  stdout.write(
    [
      "Generate bcrypt hash for ROOT_USER_PASSWORD_HASH_B64.",
      "",
      "Usage:",
      "  npm run root:hash",
      '  npm run root:hash -- --password "your-password"',
      "  npm run root:hash -- --rounds 12",
      '  echo "your-password" | npm run root:hash -- --stdin',
      "",
      "Options:",
      "  --password <value>  Password to hash (skips prompt)",
      "  --rounds <number>   Bcrypt cost factor (default: 12)",
      "  --stdin             Read password from stdin (no prompt)",
      "  --help              Show this help",
      "",
    ].join("\n"),
  );
}

function parseArgs() {
  const args = argv.slice(2);
  const result = { password: null, rounds: DEFAULT_ROUNDS, stdin: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help") {
      printHelp();
      exit(0);
    } else if (arg === "--password") {
      result.password = args[i + 1] ?? "";
      i += 1;
    } else if (arg === "--rounds") {
      const value = Number(args[i + 1]);
      if (!Number.isFinite(value) || value < 8 || value > 15) {
        stdout.write("Invalid --rounds. Use a number between 8 and 15.\n");
        exit(1);
      }
      result.rounds = value;
      i += 1;
    } else if (arg === "--stdin") {
      result.stdin = true;
    } else {
      stdout.write(`Unknown option: ${arg}\n`);
      printHelp();
      exit(1);
    }
  }
  return result;
}

function readAllStdin() {
  return new Promise((resolve) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolve(data.trim()));
  });
}

function readHidden(prompt) {
  return new Promise((resolve) => {
    if (!stdin.isTTY) {
      resolve("");
      return;
    }
    stdout.write(prompt);
    const input = [];
    const onData = (char) => {
      const key = char.toString("utf8");
      if (key === "\u0008" || key === "\u007f") {
        if (input.length > 0) {
          input.pop();
          stdout.write("\b \b");
        }
        return;
      }
      if (key === "\r" || key === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(input.join(""));
      } else if (key.startsWith("\u001b")) {
        // 이스케이프 시퀀스(화살표 등) 무시
        return;
      } else if (key === "\u0003") {
        stdin.off("data", onData);
        stdout.write("\nAborted.\n");
        exit(1);
      } else {
        input.push(key);
        stdout.write("*");
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  const { password, rounds, stdin: useStdin } = parseArgs();

  let finalPassword = password;

  if (!finalPassword && useStdin) {
    finalPassword = await readAllStdin();
  }

  if (!finalPassword) {
    if (!stdin.isTTY) {
      stdout.write("No password provided. Use --password or --stdin.\n");
      exit(1);
    }
    const first = await readHidden("Enter root password: ");
    const second = await readHidden("Confirm password: ");
    if (!first) {
      stdout.write("Password cannot be empty.\n");
      exit(1);
    }
    if (first !== second) {
      stdout.write("Passwords do not match.\n");
      exit(1);
    }
    finalPassword = first;
  }

  const hash = bcrypt.hashSync(finalPassword, rounds);
  const base64 = Buffer.from(hash, "utf8").toString("base64");
  const base64Url = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  stdout.write(`ROOT_USER_PASSWORD_HASH_B64=${base64Url}\n`);
}

main();
