"use client";

import { AppCard } from "@/shared/ui/app/app-card";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { ExternalLink } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getSdkCodeExamples } from "@/entities/sdk/model/code-examples";
import { SdkCodeBlock } from "@/entities/sdk/ui/sdk-code-block";

export function SdkQuickStart() {
  const t = useTranslations("SdkQuickStart");
  const locale = useLocale() as "ko" | "en";
  const sdkCodeExamples = getSdkCodeExamples(locale);

  const getExample = (id: string) => sdkCodeExamples.find((e) => e.id === id)!;

  return (
    <AppCard className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📦</span> {t("title")}
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.npmjs.com/package/leemage-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <span>npm</span>
              <ExternalLink size={14} />
            </a>
          </Button>
        </div>
        <p className="text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="install" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="install">{t("install")}</TabsTrigger>
            <TabsTrigger value="init">{t("init")}</TabsTrigger>
            <TabsTrigger value="upload">{t("upload")}</TabsTrigger>
            <TabsTrigger value="projects">{t("projects")}</TabsTrigger>
          </TabsList>

          <TabsContent value="install">
            <SdkCodeBlock example={getExample("install")} />
          </TabsContent>

          <TabsContent value="init">
            <SdkCodeBlock example={getExample("init")} />
          </TabsContent>

          <TabsContent value="upload">
            <SdkCodeBlock example={getExample("upload")} />
          </TabsContent>

          <TabsContent value="projects">
            <SdkCodeBlock example={getExample("projects")} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </AppCard>
  );
}
