'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, Filter, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  name: string
  slug: string
}

interface ReportData {
  group_id: string
  group_name: string
  total_clicks: number
  unique_visitors: number
  conversion_rate: number
  click_percentage?: number
  ranking_position?: number
}

type FilterType = 'hoje' | 'ontem' | 'dia_especifico' | 'periodo'

export default function RelatorioPage() {
  const [filterType, setFilterType] = useState<FilterType>('hoje')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  // Função para formatar data para exibição
  const formatDateForDisplay = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }

  // Função para obter informações do período selecionado
  const getPeriodInfo = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    switch (filterType) {
      case 'hoje':
        return {
          label: 'Hoje',
          date: formatDateForDisplay(today),
          period: formatDateForDisplay(today)
        }
      case 'ontem':
        return {
          label: 'Ontem',
          date: formatDateForDisplay(yesterday),
          period: formatDateForDisplay(yesterday)
        }
      case 'dia_especifico':
        return {
          label: 'Dia Específico',
          date: selectedDate ? formatDateForDisplay(selectedDate) : 'Não selecionado',
          period: selectedDate ? formatDateForDisplay(selectedDate) : 'Não selecionado'
        }
      case 'periodo':
        const startDateStr = startDate ? formatDateForDisplay(startDate) : 'Não selecionado'
        const endDateStr = endDate ? formatDateForDisplay(endDate) : 'Não selecionado'
        return {
          label: 'Período Personalizado',
          date: `${startDateStr} - ${endDateStr}`,
          period: `${startDateStr} - ${endDateStr}`
        }
      default:
        return {
          label: 'Não definido',
          date: 'Não selecionado',
          period: 'Não selecionado'
        }
    }
  }

  const periodInfo = getPeriodInfo()

  // Carregar grupos disponíveis
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups')
        if (!response.ok) {
          throw new Error('Falha ao carregar grupos')
        }
        const result = await response.json()
        const groups = result.data || []
        console.log('📋 Grupos carregados:', groups.length)
        setGroups(groups)
        // Selecionar todos os grupos por padrão
        const groupIds = groups.map((group: Group) => group.id)
        setSelectedGroups(groupIds)
        console.log('✅ Grupos selecionados por padrão:', groupIds.length)
      } catch (error) {
        console.error('Erro ao carregar grupos:', error)
      }
    }
    fetchGroups()
  }, [])

  // Debug do estado do botão
  useEffect(() => {
    console.log('🔘 Estado do botão - Loading:', loading, 'Grupos selecionados:', selectedGroups.length)
  }, [loading, selectedGroups])

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleSelectAllGroups = () => {
    setSelectedGroups(groups.map(group => group.id))
  }

  const handleDeselectAllGroups = () => {
    setSelectedGroups([])
  }

  const generateReport = async () => {
    console.log('🚀 Função generateReport chamada!')
    console.log('📋 Grupos selecionados:', selectedGroups)
    console.log('🔧 Tipo de filtro:', filterType)
    
    if (selectedGroups.length === 0) {
      alert('Selecione pelo menos um grupo')
      return
    }

    setLoading(true)
    console.log('⏳ Loading iniciado...')
    try {
      const payload = {
        filterType,
        selectedDate: selectedDate?.toISOString(),
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        startTime,
        endTime,
        groupIds: selectedGroups
      }

      const response = await fetch('/api/relatorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Falha ao gerar relatório')
      }

      const data = await response.json()
      console.log('📊 Dados recebidos da API:', data)
      console.log('📊 Tipo dos dados:', typeof data)
      console.log('📊 É array?', Array.isArray(data))
      
      // Extrair dados da estrutura aninhada (cada item tem propriedade 'result')
      const processedData = Array.isArray(data) 
        ? data.map(item => item.result || item).filter(item => item && item.group_id && item.total_clicks > 0)
        : []
      console.log('📊 Dados processados:', processedData)
      console.log('📊 Quantidade de itens:', processedData.length)
      
      setReportData(processedData)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (reportData.length === 0) return
    
    // Calcular totais para porcentagem
    const totalClicks = reportData.reduce((sum, item) => sum + (item.total_clicks || 0), 0)
    
    // Preparar dados com porcentagem e ranking
    const dataWithPercentage = reportData
      .filter((item) => item && item.group_id && item.total_clicks > 0)
      .map((item) => ({
        ...item,
        click_percentage: totalClicks > 0 ? ((item.total_clicks || 0) / totalClicks) * 100 : 0
      }))
      .sort((a, b) => (b.click_percentage || 0) - (a.click_percentage || 0))
      .map((item, index) => ({
        ...item,
        ranking_position: index + 1
      }))
    
    // Criar CSV
    const headers = ['Posição', 'Grupo', 'Total de Cliques', 'Porcentagem']
    const csvContent = [
      headers.join(','),
      ...dataWithPercentage.map(item => [
        item.ranking_position,
        `"${item.group_name || 'N/A'}"`,
        item.total_clicks || 0,
        `${item.click_percentage.toFixed(1)}%`
      ].join(','))
    ].join('\n')
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio-grupos-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
              <p className="text-muted-foreground">
                Visualize e exporte relatórios de click dos grupos.
              </p>
            </div>
          </div>
        </div>
        <Button onClick={exportReport} disabled={reportData.length === 0} className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filtros Avançados</CardTitle>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Dados carregados
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">{periodInfo.label}:</span>
              <span>{periodInfo.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Grupos:</span>
              <span>{selectedGroups.length > 0 ? selectedGroups.length : groups.length} selecionados</span>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
           <CardContent>
             <div className="space-y-4">
            {/* Tipo de Filtro Temporal */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="dia_especifico">Dia Específico</SelectItem>
                  <SelectItem value="periodo">Período</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de Data Específica */}
            {filterType === 'dia_especifico' && (
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

                {/* Campos de Período */}
                {filterType === 'periodo' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hora de Início</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Término</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data término"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hora de Término</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Seleção de Grupos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Grupos</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllGroups}
                      >
                        Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAllGroups}
                      >
                        Nenhum
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <Label
                          htmlFor={group.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {group.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedGroups.length} de {groups.length} grupos selecionados
                  </p>
                </div>

                {/* Botão Gerar Relatório */}
                <Button 
                  onClick={() => {
                    generateReport()
                    setShowFilters(false)
                  }} 
                  disabled={loading || selectedGroups.length === 0}
                  className="w-full"
                >
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </div>
           </CardContent>
         )}
       </Card>

      {/* Métricas Resumo */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {reportData.reduce((sum, item) => sum + (item.total_clicks || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Total de Cliques
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {reportData.length}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Grupos Ativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                 {periodInfo.period.includes(' - ') ? (
                   <>
                     {periodInfo.period.split(' - ')[0]}
                     <br />
                     <span className="text-sm font-normal">até</span>
                     <br />
                     {periodInfo.period.split(' - ')[1]}
                   </>
                 ) : (
                   periodInfo.period
                 )}
               </div>
               <div className="text-sm text-muted-foreground flex items-center gap-1">
                 <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                 {periodInfo.label}
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados */}
       {reportData.length > 0 ? (
         <div>
           {/* Tabela de Dados */}
           <Card>
             <CardContent>
               <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Posição</th>
                      <th className="text-left p-4 font-medium">Grupo</th>
                      <th className="text-right p-4 font-medium">Total de Cliques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Calcular totais para porcentagem
                      const totalClicks = reportData.reduce((sum, item) => sum + (item.total_clicks || 0), 0)
                      
                      // Calcular porcentagem e ordenar por ela
                      const dataWithPercentage = reportData
                        .filter((item) => item && item.group_id && item.total_clicks > 0)
                        .map((item) => ({
                          ...item,
                          click_percentage: totalClicks > 0 ? ((item.total_clicks || 0) / totalClicks) * 100 : 0
                        }))
                        .sort((a, b) => (b.click_percentage || 0) - (a.click_percentage || 0))
                        .map((item, index) => ({
                          ...item,
                          ranking_position: index + 1
                        }))
                      
                      return dataWithPercentage.map((item) => (
                        <tr key={item.group_id} className="border-b">
                          <td className="p-4 text-center font-bold text-lg">
                            {item.ranking_position <= 3 ? (
                              <span className="text-green-600 font-bold">
                                Top {item.ranking_position}
                              </span>
                            ) : (
                              item.ranking_position
                            )}
                          </td>
                          <td className="p-4 font-medium">
                            {item.group_name || 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-lg font-bold">
                              {(item.total_clicks || 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-green-600 font-medium">
                              {item.click_percentage.toFixed(1)}% do total
                            </p>
                          </td>
                        </tr>
                      ))
                    })()
                    }
                  </tbody>
                </table>
              </div>
             </CardContent>
           </Card>
         </div>
       ) : (
         <Card>
           <CardContent className="py-12">
             <div className="text-center text-muted-foreground">
               <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p className="text-lg font-medium mb-2">Nenhum relatório gerado</p>
               <p>Configure os filtros e clique em "Gerar Relatório" para visualizar os dados</p>
             </div>
           </CardContent>
         </Card>
       )}
      </div>
    )
  }