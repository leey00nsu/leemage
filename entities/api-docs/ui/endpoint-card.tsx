"use client";

import { ApiEndpoint } from "../model/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { toast } from "sonner";

interface EndpointCardProps {
  endpoint: ApiEndpoint;
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다.");
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                endpoint.method === "GET"
                  ? "bg-blue-500"
                  : endpoint.method === "POST"
                  ? "bg-green-500"
                  : endpoint.method === "PUT"
                  ? "bg-yellow-500"
                  : endpoint.method === "DELETE"
                  ? "bg-red-500"
                  : "bg-purple-500"
              }
            >
              {endpoint.method}
            </Badge>
            <CardTitle
              className="font-mono text-sm md:text-base cursor-pointer flex items-center gap-2"
              onClick={() => copyToClipboard(endpoint.path)}
            >
              {endpoint.path}
              <Copy
                size={14}
                className="text-muted-foreground hover:text-foreground transition-colors"
              />
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            {endpoint.description}
          </CardDescription>
        </div>
        {endpoint.auth && (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            인증 필요
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {endpoint.parameters && endpoint.parameters.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
            <div className="bg-muted p-3 rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4">이름</th>
                    <th className="text-left py-2 pr-4">타입</th>
                    <th className="text-left py-2 pr-4">필수</th>
                    <th className="text-left py-2">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((param) => (
                    <tr key={param.name} className="border-b border-border">
                      <td className="py-2 pr-4 font-mono">{param.name}</td>
                      <td className="py-2 pr-4">{param.type}</td>
                      <td className="py-2 pr-4">
                        {param.required ? "예" : "아니오"}
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
              Request Body ({endpoint.requestBody.type})
            </h4>
            <div className="bg-muted p-3 rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4">이름</th>
                    <th className="text-left py-2 pr-4">타입</th>
                    <th className="text-left py-2 pr-4">필수</th>
                    <th className="text-left py-2">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.requestBody.properties.map((prop) => (
                    <tr key={prop.name} className="border-b border-border">
                      <td className="py-2 pr-4 font-mono">{prop.name}</td>
                      <td className="py-2 pr-4">{prop.type}</td>
                      <td className="py-2 pr-4">
                        {prop.required ? "예" : "아니오"}
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
          <h4 className="text-sm font-semibold mb-2">응답</h4>
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
                    <span className="text-xs">복사</span>
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
