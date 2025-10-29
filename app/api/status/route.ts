import { getAgentStatus } from "@/lib/status";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const status = await getAgentStatus();
  return NextResponse.json(status);
}
