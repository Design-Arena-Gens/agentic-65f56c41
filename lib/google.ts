import { google, drive_v3, youtube_v3 } from "googleapis";
import { Readable } from "node:stream";
import { getEnv } from "@/lib/env";

type DriveVideo = drive_v3.Schema$File;

export type UploadContext = {
  manual?: boolean;
};

export type UploadResult =
  | {
      status: "uploaded";
      videoId: string | undefined;
      driveFileId: string;
      title: string;
      description: string;
      tags?: string[];
      metadataSource: "ai" | "template";
    }
  | {
      status: "skipped";
      reason: string;
    };

let oauthClientPromise: ReturnType<typeof createOAuthClient> | null = null;

async function createOAuthClient() {
  const env = getEnv();
  const client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
  });
  await client.getAccessToken();
  return client;
}

async function getAuthClient() {
  if (!oauthClientPromise) {
    oauthClientPromise = createOAuthClient();
  }
  return oauthClientPromise;
}

export async function listPendingDriveVideos(): Promise<DriveVideo[]> {
  const env = getEnv();
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const response = await drive.files.list({
    q: [
      `'${env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      "trashed = false",
      "mimeType contains 'video/'",
      "not appProperties has { key='uploaded' and value='true' }",
    ].join(" and "),
    pageSize: 25,
    fields:
      "files(id, name, mimeType, size, createdTime, description, appProperties, videoMediaMetadata)",
    orderBy: "createdTime",
  });

  return response.data.files ?? [];
}

export async function downloadDriveFileStream(
  fileId: string,
): Promise<Readable> {
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });
  const download = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" },
  );

  const stream = download.data as Readable;
  stream.on("error", (error) => {
    console.error("Drive stream error", error);
  });

  return stream;
}

type UploadPayload = {
  file: DriveVideo;
  stream: Readable;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus: youtube_v3.Schema$VideoStatus["privacyStatus"];
  categoryId?: string | null;
};

export async function uploadVideoToYouTube({
  file,
  stream,
  title,
  description,
  tags,
  privacyStatus,
  categoryId,
}: UploadPayload) {
  const auth = await getAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId: categoryId ?? undefined,
      },
      status: {
        privacyStatus: privacyStatus ?? "private",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: stream,
    },
  });

  const videoId = response.data.id ?? undefined;
  await markFileAsUploaded(file.id!, videoId);
  return videoId;
}

async function markFileAsUploaded(
  fileId: string,
  videoId: string | undefined,
) {
  const env = getEnv();
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });

  await drive.files.update({
    fileId,
    requestBody: {
      appProperties: {
        uploaded: "true",
        youtubeVideoId: videoId ?? "",
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  if (env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID) {
    try {
      await drive.files.update({
        fileId,
        addParents: env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID,
        removeParents: env.GOOGLE_DRIVE_FOLDER_ID,
      });
    } catch (error) {
      console.error("Failed to move file to archive folder", error);
    }
  }
}
