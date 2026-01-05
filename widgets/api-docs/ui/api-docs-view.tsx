"use client";

import { useState } from "react";
import { ApiCategory } from "@/entities/api-docs/model/types";
import { EndpointCard } from "@/entities/api-docs/ui/endpoint-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { useTranslations } from "next-intl";
import { SdkQuickStart } from "./sdk-quick-start";

interface ApiDocsViewProps {
  apiDocs: ApiCategory[];
}

export function ApiDocsView({ apiDocs }: ApiDocsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    apiDocs[0]?.name || ""
  );
  const t = useTranslations("ApiDocsView");

  const activeData = apiDocs.find(
    (category) => category.name === activeCategory
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      {/* SDK Quick Start Section */}
      <SdkQuickStart />

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Sidebar */}
        <aside className="lg:w-1/4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">{t("categoryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <nav className="space-y-2">
                {apiDocs.map((category) => (
                  <Button
                    key={category.name}
                    variant={
                      activeCategory === category.name ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category.name)}
                  >
                    <span className="flex-1 text-left">{category.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {category.endpoints.length}
                    </Badge>
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:w-3/4">
          {activeData && (
            <div className="space-y-6">
              {/* Category Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold">
                      {activeData.name}
                    </CardTitle>
                  </div>
                  <p className="text-muted-foreground">
                    {activeData.description}
                  </p>
                </CardHeader>
              </Card>

              {/* Endpoints */}
              <div className="space-y-4">
                {activeData.endpoints.map((endpoint, index) => (
                  <EndpointCard
                    key={`${endpoint.method}-${endpoint.path}-${index}`}
                    endpoint={endpoint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!activeData && (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">{t("noData")}</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
