import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { isAiConfigured } from "@/lib/ai";
import { isDatabaseConfigured } from "@/lib/db-status";
import { getT } from "@/lib/locale";
import { getPromptTemplatesForView } from "@/lib/database-data";
import { AssistantPanel } from "./assistant-panel";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const [{ t }, configured, templates] = await Promise.all([
    getT(),
    isAiConfigured(),
    getPromptTemplatesForView(),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.assistant.eyebrow}
        title={t.assistant.title}
        description={t.assistant.desc}
      />
      <AssistantPanel
        configured={configured}
        templates={templates}
        dbReady={isDatabaseConfigured()}
      />
    </AppShell>
  );
}
