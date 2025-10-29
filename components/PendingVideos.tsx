import type { AgentStatus } from "@/lib/status";

type Props = {
  status: AgentStatus;
};

export default function PendingVideos({ status }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Queue</h2>
        <p className="text-sm text-slate-300">
          These videos sit in the Drive intake folder waiting for the next run.
        </p>
      </div>
      {status.pendingVideos.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
          No pending videos detected. Drop new files into the configured Drive
          folder to schedule upcoming uploads.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {status.pendingVideos.map((video) => (
            <li
              key={video.id}
              className="rounded-xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{video.name}</p>
                  {video.createdTime ? (
                    <p className="text-xs text-slate-400">
                      Added{" "}
                      {new Date(video.createdTime).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  ) : null}
                </div>
                {video.size ? (
                  <span className="text-xs text-slate-400">{video.size}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
