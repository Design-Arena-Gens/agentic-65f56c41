"use server";

import OpenAI from "openai";
import { getEnv } from "@/lib/env";
import type { drive_v3 } from "googleapis";

export type GeneratedMetadata = {
  title: string;
  description: string;
  tags?: string[];
  source: "ai" | "template";
};

type MetadataInput = {
  file: drive_v3.Schema$File;
  defaultTitle: string;
  defaultDescription: string;
  defaultTags?: string[];
};

const FALLBACK_MODEL = "gpt-4o-mini";

export async function generateMetadata({
  file,
  defaultTitle,
  defaultDescription,
  defaultTags,
}: MetadataInput): Promise<GeneratedMetadata> {
  const env = getEnv();

  if (!env.OPENAI_API_KEY) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      tags: defaultTags,
      source: "template",
    };
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const prompt = buildPrompt({
    fileName: file.name ?? "untitled.mp4",
    description: file.description ?? "",
    defaultTitle,
    defaultDescription,
    defaultTags,
  });

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL ?? FALLBACK_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a YouTube content strategist. Respond ONLY with valid JSON that matches the schema: {\"title\": string, \"description\": string, \"tags\": string[]}. The description should be multi-line but avoid Markdown lists.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      tags: defaultTags,
      source: "template",
    };
  }

  try {
    const json = JSON.parse(content.trim());
    return {
      title: json.title ?? defaultTitle,
      description: json.description ?? defaultDescription,
      tags:
        Array.isArray(json.tags) && json.tags.length > 0
          ? json.tags
          : defaultTags,
      source: "ai",
    };
  } catch (error) {
    console.error("Failed to parse metadata JSON", error);
    return {
      title: defaultTitle,
      description: defaultDescription,
      tags: defaultTags,
      source: "template",
    };
  }
}

function buildPrompt({
  fileName,
  description,
  defaultTitle,
  defaultDescription,
  defaultTags,
}: {
  fileName: string;
  description: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultTags?: string[];
}) {
  return `
You will create metadata for a YouTube upload.

File name: ${fileName}
Existing description:
${description || "No description provided."}

Default title suggestion: ${defaultTitle}
Default description suggestion:
${defaultDescription}

Default tags: ${(defaultTags ?? []).join(", ") || "None"}

Generate an engaging but accurate title, a friendly multi-paragraph description, and up to 15 SEO-friendly tags.
`.trim();
}
