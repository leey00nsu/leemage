import { BentoGrid, BentoGridItem } from "@/shared/ui/bento-grid";
import { Image as ImageIcon, Lock, Cog, List, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations("FeaturesSection");

  const items = [
    {
      title: t("item1Title"),
      description: t("item1Description"),
      className: "md:col-span-2",
      icon: <List className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: t("item2Title"),
      description: t("item2Description"),
      className: "md:col-span-1",
      icon: <ImageIcon className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: t("item3Title"),
      description: t("item3Description"),
      className: "md:col-span-1",
      icon: <Cog className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: t("item4Title"),
      description: t("item4Description"),
      className: "md:col-span-2",
      icon: <Lock className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: t("item5Title"),
      description: t("item5Description"),
      className: "md:col-span-2",
      icon: <Share2 className="h-4 w-4 text-neutral-500" />,
    },
  ];

  return (
    <section>
      <BentoGrid className=" mx-auto md:auto-rows-auto">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </section>
  );
}
