"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AppShell({ children }: { children: ReactNode }) {
  const { currentUser } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    } else if (currentUser.mustChangePassword) {
      router.replace("/set-password");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.mustChangePassword) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
