"use client";

import { useParams } from "next/navigation";
import PayslipView from "@/features/payroll/payslip-view";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <PayslipView id={params.id} />;
}
