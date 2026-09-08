import { spawn } from "node:child_process";

// Only server-generated storage URLs are accepted. Never include signed URLs in errors.
function run(binary: string, args: string[], limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    let bytes = 0;
    let failed = false;
    const timer = setTimeout(() => {
      failed = true;
      child.kill("SIGKILL");
    }, 45_000);
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > limit) {
        failed = true;
        child.kill("SIGKILL");
      } else chunks.push(chunk);
    });
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("VIDEO_PROCESS_UNAVAILABLE"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (failed || code !== 0) reject(new Error("VIDEO_PROCESS_FAILED"));
      else resolve(Buffer.concat(chunks));
    });
  });
}

export async function processRemoteVideo(url: string) {
  if (new URL(url).protocol !== "https:") throw new Error("INVALID_VIDEO_URL");
  const input = [
    "-format_whitelist",
    "mov,matroska,webm,avi,flv,mpegts,mpeg,ogg,asf",
    "-protocol_whitelist",
    "https,tls,tcp",
    "-rw_timeout",
    "10000000",
  ];
  const metadata = await run(
    "ffprobe",
    [
      "-v",
      "error",
      ...input,
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height:format=duration",
      "-of",
      "json",
      url,
    ],
    65536,
  );
  const parsed = JSON.parse(metadata.toString()) as {
    streams?: { width: number; height: number }[];
    format?: { duration?: string };
  };
  const stream = parsed.streams?.[0];
  if (!stream || !stream.width || !stream.height)
    throw new Error("VIDEO_STREAM_MISSING");
  const duration = Number(parsed.format?.duration);
  const timestamp = Number.isFinite(duration) && duration <= 1 ? "0" : "1";
  const thumbnail = await run(
    "ffmpeg",
    [
      "-nostdin",
      "-v",
      "error",
      ...input,
      "-ss",
      timestamp,
      "-threads",
      "1",
      "-i",
      url,
      "-map",
      "0:v:0",
      "-frames:v",
      "1",
      "-vf",
      "scale=800:800:force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-threads",
      "1",
      "-f",
      "image2pipe",
      "-c:v",
      "mjpeg",
      "pipe:1",
    ],
    8 * 1024 * 1024,
  );
  if (!thumbnail.length) throw new Error("VIDEO_FRAME_MISSING");
  return { ...stream, thumbnail };
}
