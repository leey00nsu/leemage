"use client";

import React, { useState, useEffect } from "react";
import { useDateFormat } from "@/shared/lib/date-utils";

interface FormattedDateProps {
  date: Date;
  className?: string;
}

export function FormattedDate({ date, className }: FormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const { formatDate } = useDateFormat();

  useEffect(() => {
    formatDate(date).then(setFormattedDate);
  }, [date, formatDate]);

  return <span className={className}>{formattedDate}</span>;
}
