import type { ReactNode } from "react";

import { AuthProvider } from "./AuthProvider";

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}