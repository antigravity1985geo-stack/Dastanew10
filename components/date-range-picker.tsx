"use client"

import * as React from "react"
import { addDays, format, startOfMonth, startOfToday, endOfToday, subDays, startOfWeek, endOfWeek, subMonths, endOfMonth } from "date-fns"
import { ka } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DatePickerWithRange({
  className,
  date,
  setDate
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handlePresetSelect = (value: string) => {
    const today = startOfToday()
    const endToday = endOfToday()

    switch (value) {
      case "today":
        setDate({ from: today, to: endToday })
        break
      case "yesterday":
        setDate({ from: subDays(today, 1), to: subDays(endToday, 1) })
        break
      case "last7days":
        setDate({ from: subDays(today, 6), to: endToday })
        break
      case "thisMonth":
        setDate({ from: startOfMonth(today), to: endOfMonth(today) })
        break
      case "lastMonth":
        setDate({ from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) })
        break
      default:
        break
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-muted/30 border-none rounded-xl h-10",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: ka })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: ka })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: ka })
              )
            ) : (
              <span>აირჩიეთ პერიოდი</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
            <div className="p-3 w-full sm:w-48 space-y-2">
              <Select onValueChange={handlePresetSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="სწრაფი ფილტრი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">დღეს</SelectItem>
                  <SelectItem value="yesterday">გუშინ</SelectItem>
                  <SelectItem value="last7days">ბოლო 7 დღე</SelectItem>
                  <SelectItem value="thisMonth">მიმდინარე თვე</SelectItem>
                  <SelectItem value="lastMonth">წინა თვე</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                locale={ka}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
