"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Filter, Search, Sparkles, Clock, CheckCircle2, Loader2, TrendingUp, ChevronUp, ChevronDown } from "lucide-react"
import { getFilteredStats } from "@/lib/api/stats"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
// Imports removidos - não carregamos mais estatísticas

interface Group {
  id: string
  name: string
  slug: string
  clicks_count?: number
}

interface AdvancedFiltersProps {
  groups: Group[]
  onFiltersChange: (filters: {
    dateFrom: Date
    dateTo: Date
    groupIds?: string[]
    stats?: {
      dailyClicks: Array<{
        date: string
        clicks: number
      }>
      groupClicks: Array<{
        group_id: string
        group_name: string
        group_slug: string
        clicks: number
      }>
    }
  }) => void
  onExport: (format: "csv" | "json", type: "summary" | "detailed" | "both") => void
  isLoading?: boolean
}

export function AdvancedFilters({ groups, onFiltersChange, onExport, isLoading }: AdvancedFiltersProps) {
  // Inicializar com estado vazio (sem período pré-selecionado)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [quickSelect, setQuickSelect] = useState<string>("") // Começar vazio
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isGroupFilterOpen, setIsGroupFilterOpen] = useState(false)
  const [groupSearch, setGroupSearch] = useState("")
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{action: string, timestamp: number} | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasData, setHasData] = useState(false)



  const quickOptions = [
    { value: "today", label: "Hoje", days: 0 },
    { value: "yesterday", label: "Ontem", days: 1 },
    { value: "specific_date", label: "Dia Específico", days: -2 },
    { value: "custom", label: "Período Personalizado", days: -1 },
  ]

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedbackMessage({ type, message })
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  const showActionFeedback = (action: string) => {
    setActionFeedback({ action, timestamp: Date.now() })
    setTimeout(() => setActionFeedback(null), 2000)
  }

  // Função para buscar dados filtrados com integridade
  const loadFilteredStats = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Por favor, selecione um período válido')
      return
    }

    if (selectedGroups.length === 0) {
      toast.error('Por favor, selecione pelo menos um grupo para buscar os dados')
      return
    }

    setIsLoadingData(true)
    try {
      const result = await getFilteredStats(
        dateRange.from,
        dateRange.to,
        selectedGroups
      )

      // Verificar se os dados foram carregados com sucesso
      if (result && (result.dailyClicks.length > 0 || result.groupClicks.length > 0)) {
        onFiltersChange({
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          groupIds: selectedGroups,
          stats: result
        })
        setHasData(true)
        setIsCollapsed(true) // Recolher automaticamente quando dados aparecem
        toast.success('Dados carregados com sucesso!')
      } else {
        // Mesmo sem dados, notificar os filtros para limpar resultados anteriores
        onFiltersChange({
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          groupIds: selectedGroups,
          stats: result
        })
        setHasData(false)
        toast.info('Nenhum dado encontrado para o período selecionado')
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      toast.error('Erro ao carregar dados do servidor')
    } finally {
      setIsLoadingData(false)
    }
  }

  // Notificar mudanças nos filtros apenas para limpar dados anteriores
  useEffect(() => {
    // Sempre limpar os dados quando os filtros mudarem
    onFiltersChange({
      dateFrom: dateRange.from || new Date(),
      dateTo: dateRange.to || new Date(),
      groupIds: selectedGroups.length > 0 ? selectedGroups : undefined,
      stats: undefined, // Sempre limpar estatísticas quando filtros mudarem
    })
  }, [dateRange, selectedGroups, onFiltersChange])

  const handleQuickSelectChange = (value: string) => {
    setQuickSelect(value)
    
    // Garantir que a data de hoje seja sempre local
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (value === "today") {
      setDateRange({
        from: startOfDay(todayLocal),
        to: endOfDay(todayLocal),
      })
    } else if (value === "yesterday") {
      const yesterdayLocal = subDays(todayLocal, 1)
      setDateRange({
        from: startOfDay(yesterdayLocal),
        to: endOfDay(yesterdayLocal),
      })
    } else if (value === "custom" || value === "specific_date") {
      // Para dia específico e período personalizado, limpar as datas para que o usuário selecione
      setDateRange({
        from: undefined,
        to: undefined,
      })
      
      // Abrir automaticamente o calendário quando "Dia Específico" for selecionado
      if (value === "specific_date") {
        setTimeout(() => setIsDatePickerOpen(true), 100)
      }
    }
  }

  const handleGroupToggle = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    const isSelected = selectedGroups.includes(groupId)
    
    setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]))
    
    if (group) {
      showActionFeedback(isSelected ? `${group.name} removido` : `${group.name} adicionado`)
    }
  }

  const clearGroupFilters = () => {
    const clearedCount = selectedGroups.length
    setSelectedGroups([])
    showActionFeedback(`${clearedCount} grupos removidos`)
  }

  const selectAllGroups = () => {
    const filteredGroups = groups.filter(g => 
      g.name && g.name.toLowerCase().includes(groupSearch.toLowerCase())
    )
    setSelectedGroups(filteredGroups.map(g => g.id))
    showActionFeedback(`${filteredGroups.length} grupos selecionados`)
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/60 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 backdrop-blur-sm shadow-2xl shadow-black/20 transition-all duration-500 hover:shadow-lime-500/5 hover:border-slate-600/80 group/container">
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(132, 204, 22, 0.3); }
          50% { box-shadow: 0 0 20px rgba(132, 204, 22, 0.6), 0 0 30px rgba(132, 204, 22, 0.3); }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-slide-in-up {
          animation: slideInUp 0.5s ease-out;
        }
      `}</style>
      <div className="flex items-center justify-between mb-2 group/header">
        <div className="flex items-center gap-3 text-white text-xl font-bold transition-all duration-300 group-hover/container:text-lime-300">
          <div className="relative">
            <Filter className="h-6 w-6 transition-all duration-300 group-hover/header:scale-110 group-hover/header:text-lime-400 animate-float" />
            <div className="absolute inset-0 bg-lime-400/20 rounded-full scale-0 group-hover/header:scale-150 transition-transform duration-500 opacity-0 group-hover/header:opacity-100" />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover/container:from-lime-300 group-hover/container:to-emerald-300 transition-all duration-300">
            Filtros Avançados
          </span>
          {hasData && (
            <Badge className="bg-lime-500/20 text-lime-300 border-lime-500/30 text-xs px-2 py-1">
              Dados carregados
            </Badge>
          )}
        </div>
        
        {hasData && (
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-lime-300 hover:bg-lime-500/10 transition-all duration-300 p-2"
            aria-label={isCollapsed ? "Expandir filtros" : "Recolher filtros"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
        {/* Resumo dos filtros quando recolhido */}
        {isCollapsed && hasData && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300 py-3 border-t border-slate-600/30">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-4 w-4 text-lime-400" />
                <span>
                  {dateRange.from && dateRange.to && (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) === format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) ?
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) :
                      `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Filter className="h-4 w-4 text-lime-400" />
                <span>{selectedGroups.length} grupo{selectedGroups.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Conteúdo dos filtros com animação de recolhimento */}
        <div className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
        )}>
          <div className="space-y-6 pt-2">
          {/* Filtros de Data e Grupos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filtro de Data - Refatorado com UI/UX Avançado */}
            <div className="space-y-4 group">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2 transition-colors duration-200 group-hover:text-lime-300">
                  <div className="relative">
                    <Calendar className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-lime-400" />
                    <div className="absolute inset-0 bg-lime-400/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
                  </div>
                  Período de Análise
                </label>
                {(dateRange.from || dateRange.to) && (
                  <div className="flex items-center gap-1 text-xs text-lime-400 bg-lime-500/10 px-2 py-1 rounded-full border border-lime-500/20 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                    <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                    Ativo
                  </div>
                )}
              </div>
              
              <div className="relative group/select">
                <Select value={quickSelect} onValueChange={handleQuickSelectChange}>
                  <SelectTrigger className="w-full border-slate-600/60 bg-gradient-to-r from-slate-700/40 to-slate-800/40 text-slate-300 focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-700/60 hover:to-slate-800/60 hover:border-lime-500/30 hover:shadow-lg hover:shadow-lime-500/10 group/trigger backdrop-blur-sm transform hover:scale-[1.02] relative overflow-hidden py-3 px-4 font-medium text-base" aria-label="Seletor de período de análise">
                    <div className="absolute inset-0 bg-gradient-to-r from-lime-500/0 via-lime-500/5 to-lime-500/0 opacity-0 group-hover/trigger:opacity-100 transition-opacity duration-300 rounded-md" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/trigger:translate-x-full transition-transform duration-700 animate-shimmer" />
                    <SelectValue placeholder="✨ Escolha como analisar seus dados" className="relative z-10" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border-slate-600/60 backdrop-blur-xl shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-300">
                    {quickOptions.map((option, index) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value} 
                        className="text-slate-200 focus:bg-gradient-to-r focus:from-lime-500/20 focus:to-emerald-500/20 hover:bg-gradient-to-r hover:from-lime-500/10 hover:to-emerald-500/10 transition-all duration-200 cursor-pointer group/item relative overflow-hidden animate-slide-in-up py-3 px-4 font-medium text-base focus:ring-2 focus:ring-lime-400/50"
                        style={{ animationDelay: `${index * 50}ms` }}
                        aria-label={`Selecionar período: ${option.label}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-400/5 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-500" />
                        <div className="flex items-center gap-3 w-full relative z-10">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-lime-400 to-emerald-400 opacity-60 group-hover/item:opacity-100 transition-all duration-200 group-hover/item:scale-125 group-hover/item:animate-pulse" />
                          <span className="group-hover/item:text-lime-300 transition-all duration-200 group-hover/item:translate-x-1">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(quickSelect === 'custom' || quickSelect === 'specific_date') && (
                <div className="animate-in slide-in-from-top-2 fade-in-0 duration-500">
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-medium border-2 border-slate-500 bg-slate-800/60 text-white hover:bg-slate-700/70 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/30 transition-all duration-300 group/date relative overflow-hidden backdrop-blur-sm min-h-[3rem] transform hover:scale-[1.02] py-4 px-4 rounded-lg hover:border-slate-400 hover:shadow-lg hover:shadow-lime-500/20",
                          !dateRange.from && "text-slate-300",
                          dateRange.from && "border-lime-400/60 bg-gradient-to-r from-lime-500/10 to-emerald-500/10 shadow-lg shadow-lime-500/25"
                        )}
                        aria-label={dateRange.from ? `Período selecionado: ${dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : ''} ${dateRange.to ? `até ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}` : ''}` : "Selecionar período de datas"}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-lime-500/0 via-lime-500/10 to-emerald-500/0 opacity-0 group-hover/date:opacity-100 transition-all duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-r from-lime-500/5 to-emerald-500/5 opacity-0 group-focus/date:opacity-100 transition-all duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/date:translate-x-full transition-transform duration-700" />
                        

                        
                        <div className="flex items-center gap-3 relative z-10 w-full">
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            (dateRange.from || dateRange.to) 
                              ? "bg-lime-400/20 text-lime-300" 
                              : "bg-slate-600/50 text-slate-400 group-hover/date:bg-slate-500/60 group-hover/date:text-slate-300"
                          )}>
                            <Calendar className={cn(
                              "h-5 w-5 transition-all duration-300",
                              (dateRange.from || dateRange.to) 
                                ? "text-lime-400 animate-pulse" 
                                : "group-hover/date:rotate-12 group-hover/date:scale-110"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-base font-semibold transition-all duration-300",
                              (dateRange.from || dateRange.to) 
                                ? "text-lime-200" 
                                : "text-slate-300 group-hover/date:text-white"
                            )}>
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
                                "Selecione as datas"
                              )}
                            </div>
                            {(dateRange.from || dateRange.to) && (
                              <div className="text-xs text-lime-400/80 font-medium mt-1">
                                {dateRange.to ? "Período definido" : "Data inicial selecionada"}
                              </div>
                            )}
                          </div>
                          

                        </div>
                      </Button>
                    </PopoverTrigger>
                    
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600 rounded-lg" align="start">
                      <div className="p-4 border-b border-slate-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-lime-400" />
                              {quickSelect === 'specific_date' ? 'Escolha uma Data' : 'Defina o Período'}
                            </h3>

                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {quickSelect === 'specific_date' ? (
                          <div>
                            <CalendarComponent
                              initialFocus
                              mode="single"
                              defaultMonth={dateRange.from}
                              selected={dateRange.from}
                              onSelect={(selected: Date | undefined) => {
                                if (selected) {
                                  setDateRange({
                                    from: startOfDay(selected),
                                    to: endOfDay(selected),
                                  })
                                }
                                setIsDatePickerOpen(false)
                              }}
                              className="rounded-lg border-0 bg-slate-700/30"
                              classNames={{
                                months: "space-y-4",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center text-white",
                                caption_label: "text-base text-white",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-8 w-8 bg-slate-700 hover:bg-slate-600 text-white rounded-lg",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-slate-400 rounded-md w-9 text-sm",
                                row: "flex w-full mt-2",
                                cell: "text-center text-sm p-0 relative",
                                day: "h-9 w-9 p-0 text-white hover:bg-slate-600 hover:text-lime-300 rounded-lg",
                                day_selected: "bg-lime-500 text-white hover:bg-lime-600",
                                day_today: "bg-slate-600 text-lime-300 border border-lime-400/50",
                                day_outside: "text-slate-500 opacity-50",
                                day_disabled: "text-slate-600 opacity-50 cursor-not-allowed",
                                day_range_middle: "aria-selected:bg-lime-500/30 aria-selected:text-lime-200",
                                day_hidden: "invisible",
                              }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Data Inicial */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Data Inicial</label>
                                <Input
                                  type="date"
                                  value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const newDate = new Date(e.target.value)
                                      setDateRange(prev => ({
                                        ...prev,
                                        from: startOfDay(newDate)
                                      }))
                                    } else {
                                      setDateRange(prev => ({
                                        ...prev,
                                        from: undefined
                                      }))
                                    }
                                  }}
                                  className="bg-slate-700 border-slate-600 text-white focus:border-lime-400 focus:ring-lime-400/30"
                                  placeholder="Selecione a data inicial"
                                />
                              </div>
                              
                              {/* Data Final */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Data Final</label>
                                <Input
                                  type="date"
                                  value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const newDate = new Date(e.target.value)
                                      setDateRange(prev => ({
                                        ...prev,
                                        to: endOfDay(newDate)
                                      }))
                                    } else {
                                      setDateRange(prev => ({
                                        ...prev,
                                        to: undefined
                                      }))
                                    }
                                  }}
                                  className="bg-slate-700 border-slate-600 text-white focus:border-lime-400 focus:ring-lime-400/30"
                                  placeholder="Selecione a data final"
                                  min={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                                />
                              </div>
                            </div>
                            
                            {/* Botão para fechar */}
                            {(dateRange.from && dateRange.to) && (
                              <div className="flex justify-end pt-2">
                                <Button
                                  onClick={() => setIsDatePickerOpen(false)}
                                  className="bg-lime-500 hover:bg-lime-600 text-white"
                                  size="sm"
                                >
                                  Confirmar Período
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {(dateRange.from || dateRange.to) && (
                        <div className="p-4 bg-slate-700/20 border-t border-slate-600">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-lime-400" />
                            <span className="text-lime-300">
                              {quickSelect === 'specific_date' 
                                ? `Data selecionada: ${dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : ''}`
                                : dateRange.to 
                                  ? `Período: ${format(dateRange.from!, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                                  : `Início: ${format(dateRange.from!, "dd/MM/yyyy", { locale: ptBR })} (selecione data final)`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Filtro de Grupos */}
            <div className="space-y-6 group">
              <div className="flex items-center justify-between group/groups-header">
                <label className="text-lg font-bold text-white flex items-center gap-3 transition-all duration-300 group-hover/groups-header:text-lime-300">
                  <div className="relative">
                    <Filter className="h-5 w-5 text-lime-400 transition-all duration-300 group-hover/groups-header:scale-110 group-hover/groups-header:rotate-12 animate-float" />
                    <div className="absolute inset-0 bg-lime-400/20 rounded-full scale-0 group-hover/groups-header:scale-150 transition-transform duration-500 opacity-0 group-hover/groups-header:opacity-100" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover/groups-header:from-lime-300 group-hover/groups-header:to-emerald-300 transition-all duration-300">
                    Grupos
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "transition-all duration-300 transform hover:scale-105 relative overflow-hidden",
                      selectedGroups.length > 0 
                        ? "bg-gradient-to-r from-lime-600/20 to-emerald-600/20 text-lime-300 border-lime-500/30 shadow-lg shadow-lime-500/20 animate-glow" 
                        : "bg-slate-700/60 text-slate-300 border-slate-600/60 hover:border-slate-500/60"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    <span className="relative z-10 flex items-center gap-1">
                      {selectedGroups.length > 0 && <CheckCircle2 className="h-3 w-3" />}
                      {selectedGroups.length} de {groups.length}
                    </span>
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  variant={selectedGroups.length === groups.length ? "default" : "outline"}
                  size="sm"
                  onClick={selectAllGroups}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 transform hover:scale-105 group/btn focus:ring-4 focus:ring-lime-400/50 focus:outline-none border-2",
                    selectedGroups.length === groups.length
                      ? "bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 text-white border-lime-600 shadow-lg shadow-lime-500/25 animate-glow focus:border-lime-300"
                      : "border-slate-400/80 text-slate-100 hover:border-lime-500/70 hover:text-lime-200 hover:bg-gradient-to-r hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm focus:border-lime-400"
                  )}
                  aria-label={selectedGroups.length === groups.length ? "Desmarcar todos os grupos" : "Selecionar todos os grupos"}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  <CheckCircle2 className="h-4 w-4 mr-2 transition-transform duration-300 group-hover/btn:rotate-12 relative z-10" />
                  <span className="relative z-10 font-semibold">
                    {selectedGroups.length === groups.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearGroupFilters}
                  disabled={selectedGroups.length === 0}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 transform hover:scale-105 group/btn backdrop-blur-sm focus:ring-4 focus:ring-red-400/50 focus:outline-none border-2",
                    "border-slate-400/80 text-slate-100 hover:border-red-500/70 hover:text-red-200 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-red-800/30 focus:border-red-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:focus:ring-0"
                  )}
                  aria-label="Limpar seleção de grupos"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10 flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-400 opacity-60 group-hover/btn:opacity-100 transition-opacity duration-200" />
                    Limpar
                  </span>
                </Button>
              </div>
              
              <div className="relative w-full">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 bg-slate-700/50 text-slate-300 flex justify-between items-center focus:ring-2 focus:ring-lime-400 transition-all hover:bg-slate-700"
                  onClick={() => setIsGroupFilterOpen((open) => !open)}
                  type="button"
                >
                  <span>
                    {selectedGroups.length === 0
                      ? "Todos os grupos"
                      : `${selectedGroups.length} grupo${selectedGroups.length > 1 ? 's' : ''} selecionado${selectedGroups.length > 1 ? 's' : ''}`}
                  </span>
                  <Filter className="h-4 w-4" />
                </Button>
                
                {isGroupFilterOpen && (
                  <div
                    className="absolute z-20 mt-2 w-full max-h-80 overflow-hidden bg-slate-800 border border-slate-600 rounded-lg shadow-xl"
                    tabIndex={0}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsGroupFilterOpen(false)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header do dropdown */}
                    <div className="p-4 border-b border-slate-600">
                      <input
                        type="text"
                        placeholder="Buscar grupos..."
                        className="w-full px-4 py-3 rounded-lg bg-slate-800/60 text-white border-2 border-slate-500 focus:outline-none focus:ring-4 focus:ring-lime-400/30 focus:border-lime-400 transition-all duration-300 font-medium text-base hover:border-slate-400 hover:bg-slate-800/80 placeholder-slate-300"
                        value={groupSearch}
                        onChange={e => setGroupSearch(e.target.value)}
                        autoFocus
                        aria-label="Campo de busca para filtrar grupos"
                        aria-describedby="group-search-help"
                      />
                      <div id="group-search-help" className="sr-only">
                        Digite para filtrar a lista de grupos disponíveis
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={selectAllGroups} 
                          type="button"
                          className="bg-slate-600 hover:bg-slate-500 text-white"
                        >
                          Selecionar Todos
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={clearGroupFilters} 
                          type="button"
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de grupos */}
                    <div className="max-h-60 overflow-y-auto p-2" role="listbox" aria-label="Lista de grupos disponíveis">
                      <div className="space-y-1">
                        {groups
                          .filter(g => g.name && g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                          .map((g, index) => (
                            <label 
                              key={g.id} 
                              className={cn(
                                "flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors duration-200 border",
                                selectedGroups.includes(g.id)
                                  ? "bg-slate-800 border-lime-500/50 text-lime-100"
                                  : "text-slate-200 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
                              )}
                              role="option"
                              aria-selected={selectedGroups.includes(g.id)}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleGroupToggle(g.id)
                                }
                              }}
                            >
                              
                              <Checkbox
                                checked={selectedGroups.includes(g.id)}
                                onCheckedChange={() => handleGroupToggle(g.id)}
                                className="border-slate-400 data-[state=checked]:bg-lime-500 data-[state=checked]:border-lime-500"
                                aria-label={`Selecionar grupo ${g.name}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "font-medium truncate",
                                    selectedGroups.includes(g.id)
                                      ? "text-lime-200"
                                      : "text-white"
                                  )}>
                                    {g.name}
                                  </div>
                                </div>
                                <div className={cn(
                                  "text-sm mt-1 truncate",
                                  selectedGroups.includes(g.id)
                                    ? "text-lime-300/70"
                                    : "text-slate-400"
                                )}>
                                  /{g.slug}
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                      
                      {groups.filter(g => g.name && g.name.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum grupo encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Feedback Messages */}
          {feedbackMessage && (
            <div className={cn(
              "p-4 rounded-lg border",
              feedbackMessage.type === 'success' && "bg-green-900/20 border-green-500/30 text-green-300",
              feedbackMessage.type === 'error' && "bg-red-900/20 border-red-500/30 text-red-300",
              feedbackMessage.type === 'info' && "bg-blue-900/20 border-blue-500/30 text-blue-300"
            )}>
              <div className="flex items-center gap-2">
                {feedbackMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                {feedbackMessage.type === 'error' && <Clock className="h-4 w-4 text-red-400" />}
                {feedbackMessage.type === 'info' && <Sparkles className="h-4 w-4 text-blue-400" />}
                <span>{feedbackMessage.message}</span>
              </div>
            </div>
          )}

          {/* Action Feedback */}
          {actionFeedback && (
            <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full" />
                <span className="text-lime-300 text-sm">{actionFeedback.action}</span>
              </div>
            </div>
          )}

          {/* Botão de Busca - só aparece quando período e grupo estão selecionados */}
          {(dateRange.from && dateRange.to && selectedGroups.length > 0) && (
            <div className="flex justify-center pt-4">
              <div className="relative group/search-container">
                <Button
                  onClick={() => {
                    showActionFeedback('Iniciando busca...')
                    loadFilteredStats()
                  }}
                  disabled={isLoadingData}
                  size="lg"
                  className={cn(
                    "bg-lime-600 hover:bg-lime-700 text-white font-medium px-6 py-3 transition-colors duration-200",
                    isLoadingData && "opacity-75"
                  )}
                  aria-label={isLoadingData ? "Buscando dados, aguarde..." : "Buscar dados com filtros selecionados"}
                >
                  <div className="flex items-center gap-2">
                    {isLoadingData ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>Buscar Dados</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </div>
          )}
          
          {/* Mensagem de ajuda quando filtros não estão completos */}
          {(!dateRange.from || !dateRange.to || selectedGroups.length === 0) && (
            <div className="text-center text-slate-400 text-sm mt-4">
              {!dateRange.from || !dateRange.to ? (
                'Selecione um período para continuar'
              ) : selectedGroups.length === 0 ? (
                'Selecione pelo menos um grupo para buscar os dados'
              ) : null}
            </div>
          )}
          </div>
        </div>
    </div>
  )
}
