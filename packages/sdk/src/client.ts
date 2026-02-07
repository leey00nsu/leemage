import { FetchClient } from "./utils/fetch";
import { ProjectsResource } from "./resources/projects";
import { FilesResource } from "./resources/files";

/**
 * Leemage 클라이언트 옵션
 */
export interface LeemageClientOptions {
  /**
   * API 키
   *
   * Leemage 대시보드의 계정 설정에서 발급할 수 있습니다.
   */
  apiKey: string;

  /**
   * API 베이스 URL
   */
  baseUrl: string;

  /**
   * 요청 타임아웃 (밀리초)
   *
   * @default 30000
   */
  timeout?: number;

  /**
   * HTTP(baseUrl이 http://인 경우) 허용 여부
   *
   * 보안을 위해 기본값은 false이며, 로컬 개발 환경에서만 true로 설정하세요.
   * @default false
   */
  allowInsecureHttp?: boolean;
}

/**
 * Leemage API 클라이언트
 *
 * Leemage 파일 관리 플랫폼의 API를 사용하기 위한 클라이언트입니다.
 *
 * @example
 * ```ts
 * import { LeemageClient } from "leemage-sdk";
 *
 * const client = new LeemageClient({
 *   apiKey: "your-api-key",
 *   baseUrl: "https://api.your-domain.com"
 * });
 *
 * // 프로젝트 목록 조회
 * const projects = await client.projects.list();
 *
 * // 파일 업로드
 * const file = await client.files.upload(projectId, myFile, {
 *   variants: [{ sizeLabel: "max800", format: "webp" }]
 * });
 * ```
 */
export class LeemageClient {
  /**
   * Projects API
   *
   * 프로젝트 생성, 조회, 삭제 등의 기능을 제공합니다.
   */
  readonly projects: ProjectsResource;

  /**
   * Files API
   *
   * 파일 업로드, 삭제 등의 기능을 제공합니다.
   */
  readonly files: FilesResource;

  private readonly client: FetchClient;

  constructor(options: LeemageClientOptions) {
    const apiKey = options.apiKey?.trim();
    if (!apiKey) {
      throw new Error("apiKey는 필수입니다.");
    }
    const baseUrl = options.baseUrl?.trim();
    if (!baseUrl) {
      throw new Error("baseUrl은 필수입니다.");
    }

    this.client = new FetchClient({
      baseUrl,
      apiKey,
      timeout: options.timeout,
      allowInsecureHttp: options.allowInsecureHttp,
    });

    this.projects = new ProjectsResource(this.client);
    this.files = new FilesResource(this.client);
  }
}
