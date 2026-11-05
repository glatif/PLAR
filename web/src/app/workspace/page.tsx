import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";

// /workspace sends each person to the first workspace their roles open.
export default function WorkspaceIndex() {
  return (
    <Suspense>
      <SendToWorkspace />
    </Suspense>
  );
}

async function SendToWorkspace(): Promise<null> {
  const viewer = await getViewer();
  redirect(viewer?.workspaces[0] ? `/workspace/${viewer.workspaces[0]}` : "/sign-in");
}
