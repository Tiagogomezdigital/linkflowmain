export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  groupIds?: string[];
}

export async function getReportData({ startDate, endDate, groupIds }: ReportFilter) {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/relatorio/clicks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ startDate, endDate, groupIds })
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados do relatório: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error in getReportData:", error)
    return { data: [], count: 0 }
  }
}

export function generateCSV(data: any[]): string {
  // Geração simples de CSV client-side
  if (!data?.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
  return [headers.join(","), ...rows].join("\n");
}
