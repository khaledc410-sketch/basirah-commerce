"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportPrintButton() {
  return (
    <Button
      className="min-h-11"
      data-print-hidden
      onClick={() => window.print()}
      type="button"
      variant="outline"
    >
      <Printer aria-hidden="true" />
      حفظ PDF / طباعة
    </Button>
  );
}
