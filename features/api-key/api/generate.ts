"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const API_KEY_PREFIX = "lmk_";
const SALT_ROUNDS = 10;
const ADMIN_IDENTIFIER = "admin_user"; // 고정된 관리자 식별자

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

  return newApiKey;
}
