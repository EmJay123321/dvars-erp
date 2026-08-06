"use client";

import { DataProvider } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}
