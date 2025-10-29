import { validateEnv } from "@/lib/env";
import { listPendingDriveVideos } from "@/lib/google";

export type PendingVideoSummary = {
  id: string;
  name: string;
  createdTime?: string;
  size?: string;
};

export type AgentStatus = {
  envOk: boolean;
  envIssues: string[];
  pendingVideos: PendingVideoSummary[];
  timestamp: string;
};

function formatBytes(sizeInBytes?: string | null): string | undefined {
  if (!sizeInBytes) return undefined;
  const size = Number(sizeInBytes);
  if (Number.isNaN(size)) return undefined;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let value = size;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(1)} ${units[index]}`;
}

export async function getAgentStatus(): Promise<AgentStatus> {
  const validation = validateEnv();
  if (!validation.ok) {
    return {
      envOk: false,
      envIssues: validation.issues,
      pendingVideos: [],
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const pendingVideos = await listPendingDriveVideos();
    return {
      envOk: true,
      envIssues: [],
      pendingVideos: pendingVideos.map((video) => ({
        id: video.id ?? "",
        name: video.name ?? "Untitled",
        createdTime: video.createdTime ?? undefined,
        size: formatBytes(video.size),
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      envOk: false,
      envIssues: [
        error instanceof Error
          ? error.message
          : "Failed to connect to Google APIs",
      ],
      pendingVideos: [],
      timestamp: new Date().toISOString(),
    };
  }
}
