import { prisma } from "@/lib/prisma"; // Prisma 클라이언트 임포트 (경로는 실제 위치에 맞게 조정)
import { notFound } from "next/navigation";
import { ImageDetailsWidget } from "@/widgets/image/ui/image-detail-widget"; // 상세 정보 위젯 (생성 예정)

interface ImageDetailPageProps {
  params: {
    projectId: string; // 프로젝트 ID는 현재 사용하지 않지만, 필요시 활용 가능
    imageId: string;
  };
}

export default async function ImageDetailPage({
  params,
}: ImageDetailPageProps) {
  const { imageId } = await params;

  // 서버 컴포넌트에서 직접 데이터베이스 조회
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  });

  // 이미지가 없을 경우 404 페이지 표시
  if (!image) {
    notFound();
  }

  // TODO: ImageDetailsWidget 구현 후 데이터 전달
  return <ImageDetailsWidget image={image} />;
}
