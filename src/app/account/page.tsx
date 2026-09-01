import type { Metadata } from "next";

import { AccountSettings } from "@/components/account-settings";
import { accountProfileFromUser } from "@/lib/account/presentation";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const user = await requirePortalUser();
  return <AccountSettings initialProfile={accountProfileFromUser(user)} />;
}
