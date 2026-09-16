"use client";

import { createContext, useContext } from "react";
import type { SessionAccount } from "@/lib/account-auth";

const AccountContext = createContext<SessionAccount | null>(null);

export function AccountProvider({ account, children }: { account: SessionAccount | null; children: React.ReactNode }) {
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
