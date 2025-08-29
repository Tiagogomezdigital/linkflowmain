/**
 * Exemplo de integração das funções de date-utils com o componente AdvancedFilters
 * Este arquivo demonstra como usar a lógica de timezone para diferentes períodos
 */

import { useState, useEffect } from "react"
import { 
  DateFilterManager, 
  DateFilterType, 
  DateRange,
  getTodayRange,
  getYesterdayRange,
  getSpecificDateRange,
  getCustomPeriodRange,
  dateRangeToApiFormat,
  formatDateRangeForDisplay,
  getDateRangeInfo
} from "@/lib/date-utils"
import { getFilteredStats } from "@/lib/api/stats"
import { toast } from "sonner"

// Exemplo de como integrar no componente AdvancedFilters
export function AdvancedFiltersWithTimezone() {
  const [dateFilterType, setDateFilterType] = useState<DateFilterType | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Instanciar o gerenciador de datas para o timezone do Brasil
  const dateManager = new DateFilterManager(-3) // UTC-3 (Brasília)
  
  /**
   * Função para carregar dados baseado no tipo de filtro selecionado
   */
  const loadDataForPeriod = async (type: DateFilterType, specificDate?: Date, customRange?: DateRange) => {
    setIsLoading(true)
    
    try {
      let range: DateRange
      
      switch (type) {
        case 'today':
          range = dateManager.getToday()
          break
          
        case 'yesterday':
          range = dateManager.getYesterday()
          break
          
        case 'specific_date':
          if (!specificDate) {
            toast.error('Data específica é obrigatória')
            return
          }
          range = dateManager.getSpecificDate(specificDate)
          break
          
        case 'custom_period':
          if (!customRange) {
            toast.error('Período personalizado é obrigatório')
            return
          }
          range = dateManager.getCustomPeriod(customRange.from, customRange.to)
          break
          
        default:
          toast.error('Tipo de filtro não suportado')
          return
      }
      
      // Atualizar estado local
      setDateFilterType(type)
      setDateRange(range)
      
      // Converter para formato da API
      const apiFormat = dateRangeToApiFormat(range)
      
      // Chamar API
      const stats = await getFilteredStats(
        new Date(apiFormat.dateFrom),
        new Date(apiFormat.dateTo),
        selectedGroups.length > 0 ? selectedGroups : undefined
      )
      
      // Obter informações do período para exibição
      const rangeInfo = dateManager.getRangeInfo(range)
      
      console.log('Dados carregados:', {
        type,
        range,
        apiFormat,
        rangeInfo,
        stats
      })
      
      toast.success(`Dados carregados para: ${rangeInfo.displayText}`)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Handlers para diferentes tipos de período
   */
  const handleTodayClick = () => {
    loadDataForPeriod('today')
  }
  
  const handleYesterdayClick = () => {
    loadDataForPeriod('yesterday')
  }
  
  const handleSpecificDateSelect = (date: Date) => {
    loadDataForPeriod('specific_date', date)
  }
  
  const handleCustomPeriodSelect = (from: Date, to: Date) => {
    loadDataForPeriod('custom_period', undefined, { from, to })
  }
  
  /**
   * Função para exibir informações do período atual
   */
  const getCurrentPeriodInfo = () => {
    if (!dateRange) return null
    
    const info = dateManager.getRangeInfo(dateRange)
    return {
      ...info,
      formattedRange: dateManager.formatRange(dateRange)
    }
  }
  
  return (
    <div className="space-y-4">
      <h3>Filtros de Data com Timezone</h3>
      
      {/* Botões de seleção rápida */}
      <div className="flex gap-2">
        <button 
          onClick={handleTodayClick}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Hoje
        </button>
        
        <button 
          onClick={handleYesterdayClick}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Ontem
        </button>
      </div>
      
      {/* Exibir informações do período atual */}
      {dateRange && (
        <div className="p-4 bg-gray-100 rounded">
          <h4>Período Selecionado:</h4>
          <pre>{JSON.stringify(getCurrentPeriodInfo(), null, 2)}</pre>
        </div>
      )}
      
      {/* Status de carregamento */}
      {isLoading && (
        <div className="text-center py-4">
          Carregando dados...
        </div>
      )}
    </div>
  )
}

/**
 * Exemplos de uso das funções utilitárias
 */
export const DateFilterUsageExamples = {
  /**
   * Exemplo 1: Obter dados de hoje
   */
  async getTodayData() {
    console.log('=== Exemplo: Dados de Hoje ===')
    
    // Obter range para hoje
    const todayRange = getTodayRange()
    console.log('Range de hoje:', todayRange)
    
    // Converter para formato da API
    const apiFormat = dateRangeToApiFormat(todayRange)
    console.log('Formato para API:', apiFormat)
    
    // Chamar API
    try {
      const stats = await getFilteredStats(
        new Date(apiFormat.dateFrom),
        new Date(apiFormat.dateTo)
      )
      console.log('Estatísticas de hoje:', stats)
      return stats
    } catch (error) {
      console.error('Erro ao obter dados de hoje:', error)
    }
  },
  
  /**
   * Exemplo 2: Obter dados de ontem
   */
  async getYesterdayData() {
    console.log('=== Exemplo: Dados de Ontem ===')
    
    const yesterdayRange = getYesterdayRange()
    const apiFormat = dateRangeToApiFormat(yesterdayRange)
    
    console.log('Range de ontem:', yesterdayRange)
    console.log('Formato para API:', apiFormat)
    
    try {
      const stats = await getFilteredStats(
        new Date(apiFormat.dateFrom),
        new Date(apiFormat.dateTo)
      )
      console.log('Estatísticas de ontem:', stats)
      return stats
    } catch (error) {
      console.error('Erro ao obter dados de ontem:', error)
    }
  },
  
  /**
   * Exemplo 3: Obter dados de uma data específica
   */
  async getSpecificDateData(dateString: string) {
    console.log(`=== Exemplo: Dados de ${dateString} ===`)
    
    const specificDate = new Date(dateString)
    const specificRange = getSpecificDateRange(specificDate)
    const apiFormat = dateRangeToApiFormat(specificRange)
    
    console.log('Data específica:', specificDate)
    console.log('Range da data específica:', specificRange)
    console.log('Formato para API:', apiFormat)
    
    try {
      const stats = await getFilteredStats(
        new Date(apiFormat.dateFrom),
        new Date(apiFormat.dateTo)
      )
      console.log(`Estatísticas de ${dateString}:`, stats)
      return stats
    } catch (error) {
      console.error(`Erro ao obter dados de ${dateString}:`, error)
    }
  },
  
  /**
   * Exemplo 4: Obter dados de um período personalizado
   */
  async getCustomPeriodData(fromDateString: string, toDateString: string) {
    console.log(`=== Exemplo: Período ${fromDateString} a ${toDateString} ===`)
    
    const fromDate = new Date(fromDateString)
    const toDate = new Date(toDateString)
    const customRange = getCustomPeriodRange(fromDate, toDate)
    const apiFormat = dateRangeToApiFormat(customRange)
    
    console.log('Período personalizado:', { fromDate, toDate })
    console.log('Range do período:', customRange)
    console.log('Formato para API:', apiFormat)
    
    try {
      const stats = await getFilteredStats(
        new Date(apiFormat.dateFrom),
        new Date(apiFormat.dateTo)
      )
      console.log(`Estatísticas do período ${fromDateString} a ${toDateString}:`, stats)
      return stats
    } catch (error) {
      console.error(`Erro ao obter dados do período ${fromDateString} a ${toDateString}:`, error)
    }
  },
  
  /**
   * Exemplo 5: Comparar diferentes períodos
   */
  async comparePeriods() {
    console.log('=== Exemplo: Comparação de Períodos ===')
    
    const today = getTodayRange()
    const yesterday = getYesterdayRange()
    const lastWeek = getSpecificDateRange(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    const periods = [
      { name: 'Hoje', range: today },
      { name: 'Ontem', range: yesterday },
      { name: 'Semana passada', range: lastWeek }
    ]
    
    for (const period of periods) {
      const apiFormat = dateRangeToApiFormat(period.range)
      const displayText = formatDateRangeForDisplay(period.range)
      const info = getDateRangeInfo(period.range)
      
      console.log(`${period.name}:`, {
        range: period.range,
        apiFormat,
        displayText,
        info
      })
    }
  }
}

/**
 * Hook personalizado para gerenciar filtros de data
 */
export function useDateFilters(initialTimezoneOffset: number = -3) {
  const [dateManager] = useState(() => new DateFilterManager(initialTimezoneOffset))
  const [currentRange, setCurrentRange] = useState<DateRange | null>(null)
  const [currentType, setCurrentType] = useState<DateFilterType | null>(null)
  
  const setToday = () => {
    const range = dateManager.getToday()
    setCurrentRange(range)
    setCurrentType('today')
    return range
  }
  
  const setYesterday = () => {
    const range = dateManager.getYesterday()
    setCurrentRange(range)
    setCurrentType('yesterday')
    return range
  }
  
  const setSpecificDate = (date: Date) => {
    const range = dateManager.getSpecificDate(date)
    setCurrentRange(range)
    setCurrentType('specific_date')
    return range
  }
  
  const setCustomPeriod = (from: Date, to: Date) => {
    const range = dateManager.getCustomPeriod(from, to)
    setCurrentRange(range)
    setCurrentType('custom_period')
    return range
  }
  
  const getApiFormat = () => {
    if (!currentRange) return null
    return dateRangeToApiFormat(currentRange)
  }
  
  const getDisplayText = () => {
    if (!currentRange) return null
    return dateManager.formatRange(currentRange)
  }
  
  const getRangeInfo = () => {
    if (!currentRange) return null
    return dateManager.getRangeInfo(currentRange)
  }
  
  return {
    currentRange,
    currentType,
    setToday,
    setYesterday,
    setSpecificDate,
    setCustomPeriod,
    getApiFormat,
    getDisplayText,
    getRangeInfo,
    dateManager
  }
}