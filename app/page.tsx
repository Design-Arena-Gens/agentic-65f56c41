import { getAgentStatus } from "@/lib/status";
import ManualTriggerPanel from "@/components/ManualTriggerPanel";
import StatusCard from "@/components/StatusCard";
import PendingVideos from "@/components/PendingVideos";

export const dynamic = "force-dynamic";

export default async function Home() {
  const status = await getAgentStatus();
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Autonomous Ops
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Drive ➜ YouTube Daily Uploader
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Automate daily publishing by pulling fresh videos from your Google
            Drive folder, generating SEO-ready metadata, and uploading straight
            to YouTube.
          </p>
        </header>

        <StatusCard status={status} />
        <ManualTriggerPanel status={status} />
        <PendingVideos status={status} />
      </div>
    </main>
  );
}
