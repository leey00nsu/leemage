import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowRight,
  Cloud,
  Image as ImageIcon,
  Lock,
  Cog,
  List,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      {/* Hero Section */}
      <section className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Leemage: 당신의 이미지를 위한 클라우드 솔루션
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Oracle Cloud Infrastructure 기반의 강력한 이미지 관리 및 제공 서비스를
          경험하세요. 프로젝트별로 이미지를 손쉽게 관리하고 필요한 형태로
          변환하여 사용하세요.
        </p>
        <Link href="/login">
          <Button size="lg">
            지금 시작하기 <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-semibold mb-10">주요 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: OCI Storage */}
          <Card>
            <CardHeader>
              <Cloud className="h-10 w-10 text-primary mb-4 mx-auto" />
              <CardTitle>안정적인 OCI 연동</CardTitle>
              <CardDescription>
                Oracle Cloud Object Storage를 활용하여 안전하고 확장 가능한
                이미지 저장소를 제공합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 2: Project Management */}
          <Card>
            <CardHeader>
              <List className="h-10 w-10 text-primary mb-4 mx-auto" />
              <CardTitle>프로젝트별 관리</CardTitle>
              <CardDescription>
                이미지를 프로젝트 단위로 그룹화하여 효율적으로 관리하고 접근
                권한을 제어할 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 3: Image Management */}
          <Card>
            <CardHeader>
              <ImageIcon className="h-10 w-10 text-primary mb-4 mx-auto" />
              <CardTitle>간편한 이미지 관리</CardTitle>
              <CardDescription>
                직관적인 인터페이스를 통해 이미지를 손쉽게 업로드, 삭제하고
                정보를 수정할 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 4: Image Transformation */}
          <Card>
            <CardHeader>
              <Cog className="h-10 w-10 text-primary mb-4 mx-auto" />
              <CardTitle>이미지 변환</CardTitle>
              <CardDescription>
                업로드 시 자동으로 이미지를 리사이징하고 원하는 포맷으로
                변환하는 기능을 제공합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 5: Simple Auth */}
          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 text-primary mb-4 mx-auto" />
              <CardTitle>간편 인증</CardTitle>
              <CardDescription>
                환경 변수를 통한 단일 루트 사용자 로그인으로 간편하게 시스템에
                접근할 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 6: API Endpoint (Optional) */}
          <Card>
            <CardHeader>
              {/* Placeholder for API Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary mb-4 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {" "}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />{" "}
              </svg>
              <CardTitle>API 제공 (예정)</CardTitle>
              <CardDescription>
                외부 서비스와의 연동을 위한 API 엔드포인트를 제공하여 확장성을
                높일 예정입니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
