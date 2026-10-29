import { redirect } from "next/navigation";

// No role chosen yet: send people to sign in (role preview list lives there).
export default function WorkspaceIndex() {
  redirect("/sign-in");
}
