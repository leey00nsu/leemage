import { NextRequest } from "next/server";
import {
  getProjectDetailsHandler,
  deleteProjectHandler,
} from "@/lib/api/project-details";

// GET 핸들러: 특정 프로젝트 정보 및 포함된 이미지 목록(variants 포함) 조회 (세션 기반 인증)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // TODO: 세션 기반 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const { projectId } = await params;
  return getProjectDetailsHandler(projectId);
}

// DELETE 핸들러: 특정 프로젝트 및 관련 OCI 이미지(모든 variants) 삭제 (세션 기반 인증)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // TODO: 세션 기반 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const { projectId } = await params;
  return deleteProjectHandler(projectId);
}

// TODO: 프로젝트 수정(PUT), 삭제(DELETE) 핸들러 추가 (필요시)
