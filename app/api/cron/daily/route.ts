import { runDailyUpload } from "@/lib/uploader";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  try {
    const result = await runDailyUpload({ manual: false });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json(
      {
        status: "skipped",
        reason: message,
        logs: [
          {
            level: "error",
            message,
            timestamp: new Date().toISOString(),
          },
        ],
      },
      {
        status: 500,
      },
    );
  }
}
