"use client";

import { useState, useEffect } from "react";
import { relativeTime } from "@/lib/utils";

export function RelativeTime({ date, className }: { date: string | null | undefined; className?: string }) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    setText(relativeTime(date));
  }, [date]);

  if (!date || !text) return <span className={className}>—</span>;
  return <span className={className}>{text}</span>;
}
