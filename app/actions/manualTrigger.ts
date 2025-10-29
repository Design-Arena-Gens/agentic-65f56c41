"use server";

import { runDailyUpload } from "@/lib/uploader";

export async function triggerManualUpload() {
  return runDailyUpload({ manual: true });
}
