import { redirect } from "next/navigation";

import { currentUserForPage, entryPathForSession } from "@/lib/auth/page";

export default async function Home() {
  const user = await currentUserForPage();
  if (!user) redirect("/login");
  redirect(await entryPathForSession(user));
}
