import { z } from "zod";

const envSchema = z
  .object({
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z
      .string()
      .min(1, "GOOGLE_CLIENT_SECRET is required"),
    GOOGLE_REFRESH_TOKEN: z
      .string()
      .min(1, "GOOGLE_REFRESH_TOKEN is required"),
    GOOGLE_DRIVE_FOLDER_ID: z
      .string()
      .min(1, "GOOGLE_DRIVE_FOLDER_ID is required"),
    GOOGLE_DRIVE_ARCHIVE_FOLDER_ID: z.string().optional(),
    DEFAULT_VIDEO_TITLE_TEMPLATE: z
      .string()
      .default("Daily Upload: {{originalName}}"),
    DEFAULT_VIDEO_DESCRIPTION_TEMPLATE: z
      .string()
      .default(
        "Automatically scheduled upload.\n\nOriginal filename: {{originalName}}\nUploaded from Google Drive on {{uploadDate}}.",
      ),
    YOUTUBE_CATEGORY_ID: z.string().default("22"),
    YOUTUBE_PRIVACY_STATUS: z
      .enum(["public", "private", "unlisted"])
      .default("private"),
    YOUTUBE_DEFAULT_TAGS: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  })
  .transform((value) => ({
    ...value,
    tags: value.YOUTUBE_DEFAULT_TAGS
      ? value.YOUTUBE_DEFAULT_TAGS.split(",").map((tag) => tag.trim())
      : undefined,
  }));

type Env = z.output<typeof envSchema> & {
  tags?: string[];
};

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cached = result.data;
  return cached;
}

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return {
      ok: true as const,
      data: result.data,
      issues: [] as string[],
    };
  }

  const issues = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  return {
    ok: false as const,
    data: undefined,
    issues,
  };
}
