import type { AgentStatus } from "@/lib/status";

type Props = {
  status: AgentStatus;
};

export default function StatusCard({ status }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Environment</h2>
          <p className="text-sm text-slate-300">
            Validation performed at{" "}
            {new Date(status.timestamp).toLocaleString()}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            status.envOk
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-300"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status.envOk ? "bg-emerald-400" : "bg-rose-300"
            }`}
          />
          {status.envOk ? "Ready" : "Needs attention"}
        </div>
      </div>
      {!status.envOk && status.envIssues.length > 0 ? (
        <ul className="mt-6 space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          {status.envIssues.map((issue) => (
            <li key={issue} className="leading-relaxed">
              {issue}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
          All required credentials are configured. The agent can publish on the
          next scheduled run.
        </p>
      )}
    </section>
  );
}
