"use client";

import { CodeBlock } from "@/shared/ui/code-block";
import { SdkCodeExample } from "../model/code-examples";

interface SdkCodeBlockProps {
  example: SdkCodeExample;
}

export function SdkCodeBlock({ example }: SdkCodeBlockProps) {
  return (
    <CodeBlock
      language={example.language}
      filename={example.filename}
      code={example.code}
      highlightLines={example.highlightLines}
    />
  );
}
