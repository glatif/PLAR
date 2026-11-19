import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/sign-in/actions";
import { getViewer } from "@/lib/auth";

// /workspace sends each person to the first workspace their roles open.
export default function WorkspaceIndex() {
  return (
    <Suspense>
      <SendToWorkspace />
    </Suspense>
  );
}

async function SendToWorkspace() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.workspaces[0]) redirect(`/workspace/${viewer.workspaces[0]}`);

  // Signed in (for example with a new Microsoft account) but no role yet: say so instead of looping.
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="font-serif text-[28px] font-semibold leading-[34px] tracking-[-0.022em]">You&rsquo;re signed in</h1>
      <p className="mt-2 text-[15px] leading-[22px] text-label-2">
        {viewer.email} doesn&rsquo;t have a PLAR role yet. An admin needs to give you one before you can open a workspace.
      </p>
      <form action={signOut} className="mt-6">
        <button type="submit" className="h-11 rounded-full bg-fill-1 px-5 text-[15px] font-semibold hover:bg-fill-2">
          Sign out
        </button>
      </form>
    </div>
  );
}
