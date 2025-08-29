import { format, startOfDay, endOfDay, subDays, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Configuração de timezone padrão para o Brasil (offset em horas)
 * -3 para horário padrão de Brasília (BRT)
 * -2 para horário de verão de Brasília (BRST) - quando aplicável
 */
const DEFAULT_TIMEZONE_OFFSET = -3

/**
 * Tipos para diferentes períodos de filtro
 */
export type DateFilterType = 'today' | 'yesterday' | 'specific_date' | 'custom_period'

export interface DateRange {
  from: Date
  to: Date
}

export interface DateFilterOptions {
  type: DateFilterType
  specificDate?: Date
  customRange?: DateRange
  timezoneOffset?: number
}

/**
 * Obtém a data atual no timezone especificado (offset em horas)
 */
export function getCurrentDateInTimezone(timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): Date {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (timezoneOffset * 3600000))
}

/**
 * Converte uma data local para UTC considerando o timezone offset
 */
export function localDateToUTC(date: Date, timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): Date {
  const localTime = date.getTime()
  const utc = localTime - (timezoneOffset * 3600000)
  return new Date(utc)
}

/**
 * Converte uma data UTC para o timezone local
 */
export function utcDateToLocal(date: Date, timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): Date {
  const utcTime = date.getTime()
  const localTime = utcTime + (timezoneOffset * 3600000)
  return new Date(localTime)
}

/**
 * Obtém o range de datas para "hoje" no timezone especificado
 */
export function getTodayRange(timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): DateRange {
  const today = getCurrentDateInTimezone(timezoneOffset)
  const startOfToday = startOfDay(today)
  const endOfToday = endOfDay(today)
  
  return {
    from: localDateToUTC(startOfToday, timezoneOffset),
    to: localDateToUTC(endOfToday, timezoneOffset)
  }
}

/**
 * Obtém o range de datas para "ontem" no timezone especificado
 */
export function getYesterdayRange(timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): DateRange {
  const today = getCurrentDateInTimezone(timezoneOffset)
  const yesterday = subDays(today, 1)
  const startOfYesterday = startOfDay(yesterday)
  const endOfYesterday = endOfDay(yesterday)
  
  return {
    from: localDateToUTC(startOfYesterday, timezoneOffset),
    to: localDateToUTC(endOfYesterday, timezoneOffset)
  }
}

/**
 * Obtém o range de datas para um dia específico no timezone especificado
 */
export function getSpecificDateRange(date: Date, timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): DateRange {
  if (!isValid(date)) {
    throw new Error('Data inválida fornecida')
  }
  
  // Garantir que estamos trabalhando com a data no timezone correto
  const localDate = utcDateToLocal(date, timezoneOffset)
  const startOfDate = startOfDay(localDate)
  const endOfDate = endOfDay(localDate)
  
  return {
    from: localDateToUTC(startOfDate, timezoneOffset),
    to: localDateToUTC(endOfDate, timezoneOffset)
  }
}

/**
 * Obtém o range de datas para um período personalizado no timezone especificado
 */
export function getCustomPeriodRange(
  fromDate: Date, 
  toDate: Date, 
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): DateRange {
  if (!isValid(fromDate) || !isValid(toDate)) {
    throw new Error('Datas inválidas fornecidas')
  }
  
  if (fromDate > toDate) {
    throw new Error('Data de início não pode ser posterior à data de fim')
  }
  
  // Garantir que estamos trabalhando com as datas no timezone correto
  const localFromDate = utcDateToLocal(fromDate, timezoneOffset)
  const localToDate = utcDateToLocal(toDate, timezoneOffset)
  
  const startOfFromDate = startOfDay(localFromDate)
  const endOfToDate = endOfDay(localToDate)
  
  return {
    from: localDateToUTC(startOfFromDate, timezoneOffset),
    to: localDateToUTC(endOfToDate, timezoneOffset)
  }
}

/**
 * Função principal para obter range de datas baseado no tipo de filtro
 */
export function getDateRangeForFilter(options: DateFilterOptions): DateRange {
  const timezoneOffset = options.timezoneOffset || DEFAULT_TIMEZONE_OFFSET
  
  switch (options.type) {
    case 'today':
      return getTodayRange(timezoneOffset)
      
    case 'yesterday':
      return getYesterdayRange(timezoneOffset)
      
    case 'specific_date':
      if (!options.specificDate) {
        throw new Error('Data específica é obrigatória para o tipo "specific_date"')
      }
      return getSpecificDateRange(options.specificDate, timezoneOffset)
      
    case 'custom_period':
      if (!options.customRange) {
        throw new Error('Range personalizado é obrigatório para o tipo "custom_period"')
      }
      return getCustomPeriodRange(
        options.customRange.from, 
        options.customRange.to, 
        timezoneOffset
      )
      
    default:
      throw new Error(`Tipo de filtro não suportado: ${options.type}`)
  }
}

/**
 * Formata uma data para exibição considerando o timezone
 */
export function formatDateForDisplay(
  date: Date, 
  formatString: string = 'dd/MM/yyyy',
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): string {
  const localDate = utcDateToLocal(date, timezoneOffset)
  return format(localDate, formatString, { locale: ptBR })
}

/**
 * Formata um range de datas para exibição
 */
export function formatDateRangeForDisplay(
  range: DateRange,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): string {
  const fromFormatted = formatDateForDisplay(range.from, 'dd/MM/yyyy', timezoneOffset)
  const toFormatted = formatDateForDisplay(range.to, 'dd/MM/yyyy', timezoneOffset)
  
  if (fromFormatted === toFormatted) {
    return fromFormatted
  }
  
  return `${fromFormatted} - ${toFormatted}`
}

/**
 * Converte datas para o formato ISO string para envio à API
 */
export function dateRangeToApiFormat(range: DateRange): {
  dateFrom: string
  dateTo: string
} {
  return {
    dateFrom: range.from.toISOString(),
    dateTo: range.to.toISOString()
  }
}

/**
 * Valida se um range de datas é válido
 */
export function validateDateRange(range: DateRange): boolean {
  return (
    isValid(range.from) && 
    isValid(range.to) && 
    range.from <= range.to
  )
}

/**
 * Obtém informações sobre o período selecionado
 */
export function getDateRangeInfo(range: DateRange, timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET): {
  isToday: boolean
  isYesterday: boolean
  isSingleDay: boolean
  dayCount: number
  displayText: string
} {
  const today = getTodayRange(timezoneOffset)
  const yesterday = getYesterdayRange(timezoneOffset)
  
  const isToday = range.from.getTime() === today.from.getTime() && 
                  range.to.getTime() === today.to.getTime()
  
  const isYesterday = range.from.getTime() === yesterday.from.getTime() && 
                     range.to.getTime() === yesterday.to.getTime()
  
  const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
  const isSingleDay = daysDiff <= 1
  
  let displayText: string
  if (isToday) {
    displayText = 'Hoje'
  } else if (isYesterday) {
    displayText = 'Ontem'
  } else if (isSingleDay) {
    displayText = formatDateForDisplay(range.from, 'dd/MM/yyyy', timezoneOffset)
  } else {
    displayText = formatDateRangeForDisplay(range, timezoneOffset)
  }
  
  return {
    isToday,
    isYesterday,
    isSingleDay,
    dayCount: daysDiff,
    displayText
  }
}

/**
 * Classe para gerenciar filtros de data com timezone
 */
export class DateFilterManager {
  private timezoneOffset: number
  
  constructor(timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET) {
    this.timezoneOffset = timezoneOffset
  }
  
  /**
   * Obtém range para hoje
   */
  getToday(): DateRange {
    return getTodayRange(this.timezoneOffset)
  }
  
  /**
   * Obtém range para ontem
   */
  getYesterday(): DateRange {
    return getYesterdayRange(this.timezoneOffset)
  }
  
  /**
   * Obtém range para data específica
   */
  getSpecificDate(date: Date): DateRange {
    return getSpecificDateRange(date, this.timezoneOffset)
  }
  
  /**
   * Obtém range para período personalizado
   */
  getCustomPeriod(from: Date, to: Date): DateRange {
    return getCustomPeriodRange(from, to, this.timezoneOffset)
  }
  
  /**
   * Formata data para exibição
   */
  formatDate(date: Date, formatString?: string): string {
    return formatDateForDisplay(date, formatString, this.timezoneOffset)
  }
  
  /**
   * Formata range para exibição
   */
  formatRange(range: DateRange): string {
    return formatDateRangeForDisplay(range, this.timezoneOffset)
  }
  
  /**
   * Obtém informações do range
   */
  getRangeInfo(range: DateRange) {
    return getDateRangeInfo(range, this.timezoneOffset)
  }
}

/**
 * Exemplos de uso das funções
 */
export const DateFilterExamples = {
  /**
   * Exemplo: Obter dados de hoje
   */
  getToday: () => {
    const range = getTodayRange()
    const apiFormat = dateRangeToApiFormat(range)
    console.log('Hoje:', {
      range,
      apiFormat,
      display: formatDateRangeForDisplay(range)
    })
    return { range, apiFormat }
  },
  
  /**
   * Exemplo: Obter dados de ontem
   */
  getYesterday: () => {
    const range = getYesterdayRange()
    const apiFormat = dateRangeToApiFormat(range)
    console.log('Ontem:', {
      range,
      apiFormat,
      display: formatDateRangeForDisplay(range)
    })
    return { range, apiFormat }
  },
  
  /**
   * Exemplo: Obter dados de uma data específica
   */
  getSpecificDate: (dateString: string) => {
    const date = new Date(dateString)
    const range = getSpecificDateRange(date)
    const apiFormat = dateRangeToApiFormat(range)
    console.log(`Data específica (${dateString}):`, {
      range,
      apiFormat,
      display: formatDateRangeForDisplay(range)
    })
    return { range, apiFormat }
  },
  
  /**
   * Exemplo: Obter dados de um período personalizado
   */
  getCustomPeriod: (fromDateString: string, toDateString: string) => {
    const fromDate = new Date(fromDateString)
    const toDate = new Date(toDateString)
    const range = getCustomPeriodRange(fromDate, toDate)
    const apiFormat = dateRangeToApiFormat(range)
    console.log(`Período personalizado (${fromDateString} - ${toDateString}):`, {
      range,
      apiFormat,
      display: formatDateRangeForDisplay(range)
    })
    return { range, apiFormat }
  }
}