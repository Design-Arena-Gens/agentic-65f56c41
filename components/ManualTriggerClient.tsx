"use client";

import { useState, useTransition } from "react";
import { triggerManualUpload } from "@/app/actions/manualTrigger";
import type { AgentRunResult, AgentLog } from "@/lib/uploader";

type Props = {
  disabled: boolean;
};

export default function ManualTriggerClient({ disabled }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const outcome = await triggerManualUpload();
        setResult(outcome);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Manual trigger failed unexpectedly",
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
      >
        {isPending ? "Running…" : "Trigger Upload Now"}
      </button>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {result ? <ResultSummary result={result} /> : null}
    </div>
  );
}

function ResultSummary({ result }: { result: AgentRunResult }) {
  if (result.status === "skipped") {
    return (
      <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        <p className="font-medium">Run skipped</p>
        <p className="text-amber-200">{result.reason}</p>
        {result.logs.length > 0 ? <Logs logs={result.logs} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
      <p className="font-medium">
        Uploaded successfully{result.videoId ? ` → ${result.videoId}` : ""}
      </p>
      <div className="space-y-1 text-emerald-200">
        <p className="text-sm">
          <span className="font-semibold">Title:</span> {result.title}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Metadata source:</span>{" "}
          {result.metadataSource === "ai" ? "AI generated" : "Template"}
        </p>
      </div>
      {result.logs.length > 0 ? <Logs logs={result.logs} /> : null}
    </div>
  );
}

function Logs({ logs }: { logs: AgentLog[] }) {
  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-200">
      {logs.map((entry) => (
        <div key={`${entry.timestamp}-${entry.message}`}>
          <div className="font-mono text-[11px] text-slate-400">
            {new Date(entry.timestamp).toLocaleTimeString()} · {entry.level}
          </div>
          <div className="text-slate-200">{entry.message}</div>
          {entry.details ? (
            <pre className="mt-1 rounded bg-black/60 p-2 text-[11px] leading-snug text-slate-300">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}
