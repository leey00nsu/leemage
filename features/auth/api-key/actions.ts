// leemage/features/auth/api-key/actions.ts

"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
// import { revalidatePath } from 'next/cache';

const API_KEY_PREFIX = "lmk_";
const SALT_ROUNDS = 10;
const ADMIN_IDENTIFIER = "admin_user"; // 고정된 관리자 식별자

/**
 * 시스템에 설정된 API 키의 접두사 정보를 가져옵니다.
 * 실제 키 해시는 반환하지 않습니다.
 * @returns API 키 정보 객체 { prefix: string | null } 또는 키가 없으면 null
 */
export async function getApiKeyInfo(): Promise<{
  prefix: string | null;
} | null> {
  const apiKey = await prisma.apiKey.findFirst({
    select: {
      prefix: true,
    },
  });

  return apiKey ? { prefix: apiKey.prefix } : null;
}

/**
 * 시스템 관리자를 위한 새 API 키를 생성합니다.
 * 시스템에는 단 하나의 API 키만 존재할 수 있습니다.
 * @returns 생성된 API 키 (prefix 포함, 이 값은 저장되지 않으므로 즉시 사용자에게 보여줘야 함)
 * @throws 이미 키가 있는 경우 오류 발생
 */
export async function generateApiKey(): Promise<string> {
  // 이미 시스템에 API 키가 있는지 확인
  const existingKey = await prisma.apiKey.findFirst();
  if (existingKey) {
    throw new Error(
      "시스템에 이미 API 키가 존재합니다. 기존 키를 삭제하고 다시 시도하세요."
    );
  }

  // 새 API 키 생성
  const newApiKey = `${API_KEY_PREFIX}${crypto
    .randomBytes(24)
    .toString("hex")}`;
  const keyHash = await bcrypt.hash(newApiKey, SALT_ROUNDS);

  // DB에 새 API 키 생성
  await prisma.apiKey.create({
    data: {
      keyHash: keyHash,
      prefix: API_KEY_PREFIX,
      userIdentifier: ADMIN_IDENTIFIER, // 고정 식별자 사용
      // name: "관리자 키", // 필요시 이름 지정
    },
  });

  // revalidatePath(...);
  return newApiKey;
}

/**
 * 시스템의 API 키를 삭제(무효화)합니다.
 */
export async function deleteApiKey(): Promise<void> {
  // 시스템의 모든 API 키 삭제 (어차피 하나만 존재 가정)
  const { count } = await prisma.apiKey.deleteMany({
    where: {
      userIdentifier: ADMIN_IDENTIFIER, // 안전하게 식별자 지정
    },
  });

  if (count > 0) {
    console.log(`API 키 (${count}개)가 성공적으로 삭제되었습니다.`);
  } else {
    console.log("삭제할 API 키가 없습니다.");
  }

  // revalidatePath(...);
}
