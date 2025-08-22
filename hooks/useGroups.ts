import { useQuery } from "@tanstack/react-query";
import { getGroups } from "@/lib/api/groups";
import type { Group } from "@/lib/types";

export function useGroups() {
  const {
    data: groups = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return { 
    groups, 
    loading, 
    error: error?.message || null 
  };
}
