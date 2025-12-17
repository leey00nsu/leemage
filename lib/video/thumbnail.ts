import { spawn } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export interface VideoThumbnailOptions {
  inputPath: string;
  outputPath?: string;
  maxDimension?: number; // default: 800
  format?: "jpeg" | "png"; // default: 'jpeg'
  timestamp?: string; // default: '00:00:01' (1초 지점)
  timeout?: number; // default: 30000 (30초)
}

export interface VideoThumbnailResult {
  success: boolean;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * FFmpeg가 설치되어 있는지 확인
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn("ffmpeg", ["-version"]);
    process.on("error", () => resolve(false));
    process.on("close", (code) => resolve(code === 0));
  });
}

/**
 * 동영상에서 썸네일 생성
 */
export async function generateVideoThumbnail(
  options: VideoThumbnailOptions
): Promise<VideoThumbnailResult> {
  const {
    inputPath,
    maxDimension = 800,
    format = "jpeg",
    timestamp = "00:00:01",
    timeout = 30000,
  } = options;

  // 출력 경로 생성 (지정되지 않은 경우 임시 파일)
  const outputPath =
    options.outputPath ||
    join(tmpdir(), `thumbnail-${randomUUID()}.${format === "jpeg" ? "jpg" : "png"}`);

  // 입력 파일 존재 확인
  if (!existsSync(inputPath)) {
    return {
      success: false,
      error: "입력 파일이 존재하지 않습니다.",
    };
  }

  return new Promise((resolve) => {
    // FFmpeg 명령어 구성
    // -ss: 시작 시간
    // -i: 입력 파일
    // -vframes 1: 1프레임만 추출
    // -vf scale: 최대 크기 제한 (비율 유지)
    // -y: 출력 파일 덮어쓰기
    const scaleFilter = `scale='min(${maxDimension},iw)':min'(${maxDimension},ih)':force_original_aspect_ratio=decrease`;
    
    const args = [
      "-ss", timestamp,
      "-i", inputPath,
      "-vframes", "1",
      "-vf", scaleFilter,
      "-y",
      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", args);
    let stderr = "";

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      ffmpeg.kill("SIGKILL");
      resolve({
        success: false,
        error: "썸네일 생성 시간이 초과되었습니다.",
      });
    }, timeout);

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("error", (err) => {
      clearTimeout(timeoutId);
      if (err.message.includes("ENOENT")) {
        resolve({
          success: false,
          error: "FFmpeg가 설치되어 있지 않습니다.",
        });
      } else {
        resolve({
          success: false,
          error: `FFmpeg 실행 오류: ${err.message}`,
        });
      }
    });

    ffmpeg.on("close", (code) => {
      clearTimeout(timeoutId);

      if (code === 0 && existsSync(outputPath)) {
        // 썸네일 크기 정보 추출 (stderr에서 파싱)
        const dimensions = parseDimensionsFromFFmpegOutput(stderr);
        
        resolve({
          success: true,
          thumbnailPath: outputPath,
          width: dimensions?.width,
          height: dimensions?.height,
        });
      } else {
        resolve({
          success: false,
          error: `썸네일 생성 실패 (코드: ${code})`,
        });
      }
    });
  });
}

/**
 * FFmpeg 출력에서 비디오 크기 정보 파싱
 */
function parseDimensionsFromFFmpegOutput(
  output: string
): { width: number; height: number } | null {
  // Stream #0:0: Video: ... 1920x1080 ... 형식에서 추출
  const match = output.match(/(\d{2,5})x(\d{2,5})/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * 버퍼에서 썸네일 생성 (스트림 처리)
 */
export async function generateThumbnailFromBuffer(
  buffer: Buffer,
  mimeType: string,
  options: Omit<VideoThumbnailOptions, "inputPath"> = {}
): Promise<VideoThumbnailResult & { buffer?: Buffer }> {
  const { readFileSync, writeFileSync } = await import("fs");
  
  // 임시 입력 파일 생성
  const ext = getExtensionFromMimeType(mimeType);
  const tempInputPath = join(tmpdir(), `video-input-${randomUUID()}.${ext}`);
  
  try {
    writeFileSync(tempInputPath, buffer);
    
    const result = await generateVideoThumbnail({
      ...options,
      inputPath: tempInputPath,
    });

    if (result.success && result.thumbnailPath) {
      const thumbnailBuffer = readFileSync(result.thumbnailPath);
      
      // 임시 썸네일 파일 삭제
      try {
        unlinkSync(result.thumbnailPath);
      } catch {
        // 삭제 실패 무시
      }
      
      return {
        ...result,
        buffer: thumbnailBuffer,
      };
    }

    return result;
  } finally {
    // 임시 입력 파일 삭제
    try {
      unlinkSync(tempInputPath);
    } catch {
      // 삭제 실패 무시
    }
  }
}

/**
 * MIME 타입에서 파일 확장자 추출
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
    "video/x-matroska": "mkv",
    "video/mpeg": "mpeg",
    "video/3gpp": "3gp",
    "video/3gpp2": "3g2",
  };
  return mimeToExt[mimeType] || "mp4";
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration?: number;
}

/**
 * 비디오 메타데이터 추출 (FFprobe 사용)
 */
export async function getVideoMetadata(
  inputPath: string,
  timeout: number = 10000
): Promise<VideoMetadata | null> {
  return new Promise((resolve) => {
    const args = [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration",
      "-of", "json",
      inputPath,
    ];

    const ffprobe = spawn("ffprobe", args);
    let stdout = "";
    let stderr = "";

    const timeoutId = setTimeout(() => {
      ffprobe.kill("SIGKILL");
      resolve(null);
    }, timeout);

    ffprobe.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffprobe.on("error", () => {
      clearTimeout(timeoutId);
      resolve(null);
    });

    ffprobe.on("close", (code) => {
      clearTimeout(timeoutId);

      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          const stream = result.streams?.[0];
          if (stream?.width && stream?.height) {
            resolve({
              width: stream.width,
              height: stream.height,
              duration: stream.duration ? parseFloat(stream.duration) : undefined,
            });
            return;
          }
        } catch {
          // JSON 파싱 실패
        }
      }
      resolve(null);
    });
  });
}

/**
 * 버퍼에서 비디오 메타데이터 추출
 */
export async function getVideoMetadataFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<VideoMetadata | null> {
  const { writeFileSync } = await import("fs");
  
  const ext = getExtensionFromMimeType(mimeType);
  const tempInputPath = join(tmpdir(), `video-meta-${randomUUID()}.${ext}`);
  
  try {
    writeFileSync(tempInputPath, buffer);
    return await getVideoMetadata(tempInputPath);
  } finally {
    try {
      unlinkSync(tempInputPath);
    } catch {
      // 삭제 실패 무시
    }
  }
}
