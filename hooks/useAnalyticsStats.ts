import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/analytics";

export function useAnalyticsStats() {
  const {
    data: stats,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  return { 
    stats, 
    loading, 
    error: error?.message || null 
  };
}
