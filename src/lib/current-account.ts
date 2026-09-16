import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNT_SESSION_COOKIE, verifyAccountSession } from "@/lib/account-auth";

export async function getCurrentAccount() {
  const store = await cookies();
  return verifyAccountSession(store.get(ACCOUNT_SESSION_COOKIE)?.value);
}

export async function requireOwnerAccount() {
  const account = await getCurrentAccount();
  if (!account || account.kind !== "owner") redirect("/");
  return account;
}
