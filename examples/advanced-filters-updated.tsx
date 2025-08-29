/**
 * Versão atualizada do componente AdvancedFilters usando as funções de date-utils
 * Este exemplo mostra como integrar a lógica de timezone no componente existente
 */

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
import { Badge } from "@/components/ui/badge"

// Importar as novas funções de date-utils
import {
  DateFilterManager,
  DateFilterType,
  DateRange,
  dateRangeToApiFormat,
  formatDateRangeForDisplay,
  getDateRangeInfo
} from "@/lib/date-utils"

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

export function AdvancedFiltersUpdated({ groups, onFiltersChange, onExport, isLoading }: AdvancedFiltersProps) {
  // Instanciar o gerenciador de datas para o timezone do Brasil
  const [dateManager] = useState(() => new DateFilterManager(-3)) // UTC-3 (Brasília)
  
  // Estados para controle de filtros
  const [quickSelect, setQuickSelect] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  
  // Estados para UI
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAllGroups, setShowAllGroups] = useState(false)
  
  /**
   * Função principal para carregar estatísticas filtradas
   */
  const loadFilteredStats = async (range: DateRange, groupIds?: string[]) => {
    if (!range) {
      toast.error('Período deve ser selecionado')
      return
    }
    
    setIsLoadingStats(true)
    
    try {
      // Converter para formato da API
      const apiFormat = dateRangeToApiFormat(range)
      
      // Chamar API
      const stats = await getFilteredStats(
        new Date(apiFormat.dateFrom),
        new Date(apiFormat.dateTo),
        groupIds && groupIds.length > 0 ? groupIds : undefined
      )
      
      // Obter informações do período para log
      const rangeInfo = getDateRangeInfo(range)
      
      console.log('Estatísticas carregadas:', {
        range,
        apiFormat,
        rangeInfo,
        groupIds,
        stats
      })
      
      // Chamar callback com os dados
      onFiltersChange({
        dateFrom: new Date(apiFormat.dateFrom),
        dateTo: new Date(apiFormat.dateTo),
        groupIds,
        stats
      })
      
      toast.success(`Dados carregados para: ${rangeInfo.displayText}`)
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoadingStats(false)
    }
  }
  
  /**
   * Handler para seleção rápida de período
   */
  const handleQuickSelectChange = (value: string) => {
    setQuickSelect(value)
    let range: DateRange | null = null
    
    switch (value) {
      case 'today':
        range = dateManager.getToday()
        break
        
      case 'yesterday':
        range = dateManager.getYesterday()
        break
        
      case 'specific_date':
      case 'custom_period':
        // Para estes casos, limpar o range para que o usuário selecione
        range = null
        setDateRange(null)
        break
        
      default:
        range = null
        break
    }
    
    if (range) {
      setDateRange(range)
      // Carregar dados automaticamente para seleções rápidas
      loadFilteredStats(range, selectedGroups)
    }
  }
  
  /**
   * Handler para seleção de data específica no calendário
   */
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    let range: DateRange
    
    if (quickSelect === 'specific_date') {
      // Data específica - um dia apenas
      range = dateManager.getSpecificDate(date)
    } else {
      // Período personalizado - lógica para from/to
      if (!dateRange || !dateRange.from) {
        // Primeira data selecionada
        range = {
          from: dateManager.getSpecificDate(date).from,
          to: dateManager.getSpecificDate(date).to
        }
      } else {
        // Segunda data selecionada - criar período
        const fromDate = new Date(dateRange.from)
        const toDate = date
        
        if (fromDate <= toDate) {
          range = dateManager.getCustomPeriod(fromDate, toDate)
        } else {
          range = dateManager.getCustomPeriod(toDate, fromDate)
        }
      }
    }
    
    setDateRange(range)
    setIsCalendarOpen(false)
    
    // Carregar dados automaticamente
    loadFilteredStats(range, selectedGroups)
  }
  
  /**
   * Handler para mudança na seleção de grupos
   */
  const handleGroupToggle = (groupId: string) => {
    const newSelectedGroups = selectedGroups.includes(groupId)
      ? selectedGroups.filter(id => id !== groupId)
      : [...selectedGroups, groupId]
    
    setSelectedGroups(newSelectedGroups)
    
    // Se há um período selecionado, recarregar dados
    if (dateRange) {
      loadFilteredStats(dateRange, newSelectedGroups)
    }
  }
  
  /**
   * Função para limpar todos os filtros
   */
  const clearAllFilters = () => {
    setQuickSelect('')
    setDateRange(null)
    setSelectedGroups([])
    setSearchTerm('')
  }
  
  /**
   * Função para selecionar todos os grupos filtrados
   */
  const selectAllFilteredGroups = () => {
    const filteredGroups = groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const allFilteredIds = filteredGroups.map(group => group.id)
    setSelectedGroups(allFilteredIds)
    
    // Se há um período selecionado, recarregar dados
    if (dateRange) {
      loadFilteredStats(dateRange, allFilteredIds)
    }
  }
  
  /**
   * Obter texto de exibição do período atual
   */
  const getDateRangeDisplayText = () => {
    if (!dateRange) return 'Selecionar período'
    
    const info = getDateRangeInfo(dateRange)
    return info.displayText
  }
  
  /**
   * Filtrar grupos baseado no termo de busca
   */
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const displayedGroups = showAllGroups ? filteredGroups : filteredGroups.slice(0, 10)
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Filtros Avançados</h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          disabled={isLoadingStats}
        >
          Limpar Filtros
        </Button>
      </div>
      
      {/* Seleção Rápida de Período */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Período
        </label>
        
        <Select value={quickSelect} onValueChange={handleQuickSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="specific_date">Dia Específico</SelectItem>
            <SelectItem value="custom_period">Período Personalizado</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Exibir período selecionado */}
        {dateRange && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Período selecionado: {getDateRangeDisplayText()}
              </span>
            </div>
            
            {/* Informações adicionais do período */}
            {(() => {
              const info = getDateRangeInfo(dateRange)
              return (
                <div className="mt-2 text-xs text-blue-600">
                  {info.isSingleDay ? 'Dia único' : `${info.dayCount} dias`}
                  {info.isToday && ' • Hoje'}
                  {info.isYesterday && ' • Ontem'}
                </div>
              )
            })()}
          </div>
        )}
      </div>
      
      {/* Calendário para seleção de data */}
      {(quickSelect === 'specific_date' || quickSelect === 'custom_period') && (
        <div className="space-y-3">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange ? getDateRangeDisplayText() : (
                  quickSelect === 'specific_date' ? 'Selecionar data' : 'Selecionar período'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateRange?.from}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {/* Seleção de Grupos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Grupos ({selectedGroups.length} selecionados)
          </label>
          
          {filteredGroups.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllFilteredGroups}
              disabled={isLoadingStats}
            >
              Selecionar Todos
            </Button>
          )}
        </div>
        
        {/* Busca de grupos */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Lista de grupos */}
        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
          {displayedGroups.map((group) => (
            <div key={group.id} className="flex items-center space-x-3">
              <Checkbox
                id={group.id}
                checked={selectedGroups.includes(group.id)}
                onCheckedChange={() => handleGroupToggle(group.id)}
              />
              <label
                htmlFor={group.id}
                className="flex-1 text-sm cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{group.name}</span>
                  <span className="text-gray-500 ml-2">({group.slug})</span>
                </div>
                {group.clicks_count !== undefined && (
                  <Badge variant="secondary">
                    {group.clicks_count} clicks
                  </Badge>
                )}
              </label>
            </div>
          ))}
          
          {filteredGroups.length > 10 && !showAllGroups && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllGroups(true)}
              className="w-full"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Mostrar mais {filteredGroups.length - 10} grupos
            </Button>
          )}
          
          {showAllGroups && filteredGroups.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllGroups(false)}
              className="w-full"
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              Mostrar menos
            </Button>
          )}
        </div>
        
        {filteredGroups.length === 0 && searchTerm && (
          <div className="text-center py-4 text-gray-500">
            Nenhum grupo encontrado para "{searchTerm}"
          </div>
        )}
      </div>
      
      {/* Status de carregamento */}
      {isLoadingStats && (
        <div className="flex items-center justify-center py-4 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Carregando dados...
        </div>
      )}
      
      {/* Botões de ação */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={() => dateRange && loadFilteredStats(dateRange, selectedGroups)}
          disabled={!dateRange || isLoadingStats}
          className="flex-1"
        >
          {isLoadingStats ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Carregando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => onExport('csv', 'summary')}
          disabled={!dateRange || isLoadingStats}
        >
          Exportar
        </Button>
      </div>
    </div>
  )
}

/**
 * Exemplo de uso do componente atualizado
 */
export function ExampleUsage() {
  const [groups] = useState<Group[]>([
    { id: '1', name: 'Grupo A', slug: 'grupo-a', clicks_count: 150 },
    { id: '2', name: 'Grupo B', slug: 'grupo-b', clicks_count: 89 },
    { id: '3', name: 'Grupo C', slug: 'grupo-c', clicks_count: 234 }
  ])
  
  const handleFiltersChange = (filters: any) => {
    console.log('Filtros aplicados:', filters)
    // Aqui você atualizaria o estado da página principal
  }
  
  const handleExport = (format: string, type: string) => {
    console.log('Exportar:', { format, type })
    // Aqui você implementaria a lógica de exportação
  }
  
  return (
    <div className="max-w-md mx-auto p-6">
      <AdvancedFiltersUpdated
        groups={groups}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
      />
    </div>
  )
}