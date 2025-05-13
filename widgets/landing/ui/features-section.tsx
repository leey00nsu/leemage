import { BentoGrid, BentoGridItem } from "@/shared/ui/bento-grid";
import { Image as ImageIcon, Lock, Cog, List, Share2 } from "lucide-react";

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);

const items = [
  {
    title: "프로젝트별 관리",
    description:
      "이미지를 프로젝트 단위로 그룹화하여 효율적으로 관리할 수 있습니다.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <List className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "간편한 이미지 관리",
    description:
      "직관적인 인터페이스를 통해 이미지를 손쉽게 업로드, 삭제하고 정보를 수정할 수 있습니다.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <ImageIcon className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "이미지 변환",
    description:
      "업로드 시 자동으로 이미지를 리사이징하고 원하는 포맷으로 변환하는 기능을 제공합니다.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <Cog className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "간편 인증",
    description: "간편한 인증을 통해 시스템에 접근할 수 있습니다.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <Lock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "API 지원",
    description: "API를 통해 외부 프로젝트에서 이미지를 관리할 수 있습니다.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <Share2 className="h-4 w-4 text-neutral-500" />,
  },
];

export function FeaturesSection() {
  return (
    <section>
      <BentoGrid className=" mx-auto md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </section>
  );
}
