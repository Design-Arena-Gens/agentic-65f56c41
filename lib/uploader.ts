import type { UploadResult, UploadContext } from "@/lib/google";
import {
  downloadDriveFileStream,
  listPendingDriveVideos,
  uploadVideoToYouTube,
} from "@/lib/google";
import { getEnv } from "@/lib/env";
import { generateMetadata } from "@/lib/metadataAgent";

type AgentLogLevel = "info" | "error" | "warn";

export type AgentLog = {
  level: AgentLogLevel;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

export type AgentRunResult = UploadResult & {
  logs: AgentLog[];
};

function createLogger() {
  const logs: AgentLog[] = [];
  const log = (
    level: AgentLogLevel,
    message: string,
    details?: Record<string, unknown>,
  ) => {
    const entry: AgentLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    logs.push(entry);
  };

  return {
    log,
    logs,
  };
}

function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
    const normalized = key.trim();
    return variables[normalized] ?? "";
  });
}

export async function runDailyUpload(
  context: UploadContext = {},
): Promise<AgentRunResult> {
  const { log, logs } = createLogger();

  log("info", "Starting upload agent run", { manual: context.manual ?? false });

  try {
    const env = getEnv();
    const pendingVideos = await listPendingDriveVideos();
    if (pendingVideos.length === 0) {
      log("info", "No pending videos in Drive folder");
      return {
        status: "skipped",
        reason: "No pending videos available",
        logs,
      };
    }

    const file = pendingVideos[0];
    log("info", "Selected Drive file for upload", {
      fileId: file.id,
      fileName: file.name,
    });

    const variables = {
      originalName: file.name ?? "Untitled Video",
      uploadDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    const defaultTitle = renderTemplate(
      env.DEFAULT_VIDEO_TITLE_TEMPLATE,
      variables,
    );
    const defaultDescription = renderTemplate(
      env.DEFAULT_VIDEO_DESCRIPTION_TEMPLATE,
      variables,
    );

    const metadata = await generateMetadata({
      file,
      defaultTitle,
      defaultDescription,
      defaultTags: env.tags,
    });

    log("info", "Prepared metadata", {
      source: metadata.source,
      title: metadata.title,
    });

    const stream = await downloadDriveFileStream(file.id!);
    const videoId = await uploadVideoToYouTube({
      file,
      stream,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      privacyStatus: env.YOUTUBE_PRIVACY_STATUS,
      categoryId: env.YOUTUBE_CATEGORY_ID,
    });

    log("info", "Upload completed", {
      videoId,
      fileId: file.id,
    });

    return {
      status: "uploaded",
      videoId,
      driveFileId: file.id!,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      metadataSource: metadata.source,
      logs,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upload failure";
    log("error", "Agent run failed", {
      error: message,
    });

    return {
      status: "skipped",
      reason: message,
      logs,
    };
  }
}
