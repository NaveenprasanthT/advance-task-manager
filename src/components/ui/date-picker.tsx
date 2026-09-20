"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  displayFormat?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  displayFormat = "PPP",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start overflow-hidden font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4 shrink-0" />
            <span className="truncate">{date ? format(date, displayFormat) : placeholder}</span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          disabled={disabled}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
