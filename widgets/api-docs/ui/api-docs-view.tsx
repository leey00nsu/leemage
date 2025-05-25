"use client";

import { useState } from "react";
import { ApiCategory } from "@/entities/api-docs/model/types";
import { EndpointCard } from "@/entities/api-docs/ui/endpoint-card";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "next-intl";

interface ApiDocsViewProps {
  apiDocs: ApiCategory[];
}

export function ApiDocsView({ apiDocs }: ApiDocsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    apiDocs[0]?.name || ""
  );
  const t = useTranslations("ApiDocsView");

  return (
    <div className="container mx-auto p-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-1/4">
          <div className="sticky top-20">
            <h2 className="text-lg font-semibold mb-4">{t("categoryTitle")}</h2>
            <ul className="space-y-1">
              {apiDocs.map((category) => (
                <li key={category.name}>
                  <Button
                    variant={
                      activeCategory === category.name ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category.name)}
                  >
                    {category.name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="md:w-3/4">
          {apiDocs.map(
            (category) =>
              category.name === activeCategory && (
                <div key={category.name}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                    <p className="text-muted-foreground">
                      {category.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {category.endpoints.map((endpoint, index) => (
                      <EndpointCard
                        key={`${endpoint.method}-${endpoint.path}-${index}`}
                        endpoint={endpoint}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </main>
      </div>
    </div>
  );
}
