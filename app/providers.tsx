"use client";

import { DataProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DataProvider>{children}</DataProvider>
    </ToastProvider>
  );
}
