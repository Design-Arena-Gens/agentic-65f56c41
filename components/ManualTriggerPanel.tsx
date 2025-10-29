import ManualTriggerClient from "@/components/ManualTriggerClient";
import type { AgentStatus } from "@/lib/status";

type Props = {
  status: AgentStatus;
};

export default function ManualTriggerPanel({ status }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Manual launch</h2>
        <p className="text-sm text-slate-300">
          Fire the agent immediately to grab the next video from Drive. Use this
          when you want to publish outside the daily window.
        </p>
      </div>
      <div className="mt-6">
        <ManualTriggerClient disabled={!status.envOk} />
      </div>
      {!status.envOk ? (
        <p className="mt-4 text-xs text-rose-200">
          Configure environment variables before triggering an upload.
        </p>
      ) : null}
    </section>
  );
}
