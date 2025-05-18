import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
import { apiDocsData } from "@/entities/api-docs/model/data";

export default function ApiDocsPage() {
  return <ApiDocsView apiDocs={apiDocsData} />;
}
