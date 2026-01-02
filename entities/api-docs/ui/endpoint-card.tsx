"use client";

import { ApiEndpoint } from "../model/types";
import { getEndpointSdkExample } from "../model/endpoint-sdk-examples";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { CodeBlock } from "@/shared/ui/code-block";
import { Copy, Code2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";

interface EndpointCardProps {
  endpoint: ApiEndpoint;
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  const t = useTranslations("EndpointCard");
  const locale = useLocale() as "ko" | "en";
  const [showSdk, setShowSdk] = useState(false);

  const sdkExample = getEndpointSdkExample(
    endpoint.method,
    endpoint.path,
    locale
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(t("copiedToClipboard"));
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <Badge
              className={`shrink-0 ${
                endpoint.method === "GET"
                  ? "bg-blue-500"
                  : endpoint.method === "POST"
                  ? "bg-green-500"
                  : endpoint.method === "PUT"
                  ? "bg-yellow-500"
                  : endpoint.method === "DELETE"
                  ? "bg-red-500"
                  : "bg-purple-500"
              }`}
            >
              {endpoint.method}
            </Badge>
            <CardTitle
              className="font-mono text-xs sm:text-sm md:text-base cursor-pointer flex items-center gap-2 break-all min-w-0"
              onClick={() => copyToClipboard(endpoint.path)}
            >
              <span className="break-all">{endpoint.path}</span>
              <Copy
                size={14}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              />
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            {endpoint.description}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {sdkExample && (
            <Button
              variant={showSdk ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSdk(!showSdk)}
              className="flex items-center gap-1"
            >
              <Code2 size={14} />
              <span>SDK</span>
            </Button>
          )}
          {endpoint.auth && (
            <Badge
              variant="outline"
              className="shrink-0 border-amber-500 text-amber-500"
            >
              {t("authRequired")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* SDK Example Section */}
        {showSdk && sdkExample && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Code2 size={14} />
              SDK Example
            </h4>
            <CodeBlock
              language={sdkExample.language}
              filename="example.ts"
              code={sdkExample.code}
            />
          </div>
        )}

        {endpoint.parameters && endpoint.parameters.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">{t("parameters")}</h4>
            <div className="bg-muted p-3 rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4">{t("name")}</th>
                    <th className="text-left py-2 pr-4">{t("type")}</th>
                    <th className="text-left py-2 pr-4">{t("required")}</th>
                    <th className="text-left py-2">{t("description")}</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((param) => (
                    <tr key={param.name} className="border-b border-border">
                      <td className="py-2 pr-4 font-mono">{param.name}</td>
                      <td className="py-2 pr-4">{param.type}</td>
                      <td className="py-2 pr-4">
                        {param.required ? t("yes") : t("no")}
                      </td>
                      <td className="py-2">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {endpoint.requestBody && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">
              {t("requestBody")} ({endpoint.requestBody.type})
            </h4>
            <div className="bg-muted p-3 rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4">{t("name")}</th>
                    <th className="text-left py-2 pr-4">{t("type")}</th>
                    <th className="text-left py-2 pr-4">{t("required")}</th>
                    <th className="text-left py-2">{t("description")}</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.requestBody.properties.map((prop) => (
                    <tr key={prop.name} className="border-b border-border">
                      <td className="py-2 pr-4 font-mono">{prop.name}</td>
                      <td className="py-2 pr-4">{prop.type}</td>
                      <td className="py-2 pr-4">
                        {prop.required ? t("yes") : t("no")}
                      </td>
                      <td className="py-2">{prop.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold mb-2">{t("response")}</h4>
          <Tabs defaultValue={endpoint.responses[0]?.status.toString()}>
            <TabsList className="mb-2">
              {endpoint.responses.map((response) => (
                <TabsTrigger
                  key={response.status}
                  value={response.status.toString()}
                >
                  {response.status}
                </TabsTrigger>
              ))}
            </TabsList>
            {endpoint.responses.map((response) => (
              <TabsContent
                key={response.status}
                value={response.status.toString()}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {response.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(response.example, null, 2))
                    }
                  >
                    <Copy size={14} />
                    <span className="text-xs">{t("copy")}</span>
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded-md overflow-auto text-xs md:text-sm">
                  <code>{JSON.stringify(response.example, null, 2)}</code>
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
