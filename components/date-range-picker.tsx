"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DateRangePickerProps {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white",
            !dateRange.from && "text-slate-500",
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
            )
          ) : (
            <span>Selecione o período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={dateRange.from}
          selected={{ from: dateRange.from, to: dateRange.to }}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              // Ambas as datas foram selecionadas
              onDateRangeChange({
                from: range.from,
                to: range.to,
              })
              setIsOpen(false)
            } else if (range?.from && !range?.to) {
              // Apenas a data inicial foi selecionada
              onDateRangeChange({
                from: range.from,
                to: undefined,
              })
            } else {
              // Nenhuma data selecionada ou seleção foi limpa
              onDateRangeChange({
                from: undefined,
                to: undefined,
              })
            }
          }}
          numberOfMonths={2}
          className="text-white"
          classNames={{
            day_today: "bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold shadow-lg ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-800",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
