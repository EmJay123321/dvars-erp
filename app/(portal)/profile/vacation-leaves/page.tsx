"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VacationLeavesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/vacation-leaves");
  }, [router]);
  return null;
}
