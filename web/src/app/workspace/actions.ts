"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Marks one of your own tasks done, or reopens it. Row-level security rejects anyone else's task. */
export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = formData.get("done") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("tasks").update({ status: done ? "todo" : "done" }).eq("id", id);
  refresh();
}
