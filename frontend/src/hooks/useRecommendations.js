import { useQuery } from "@tanstack/react-query";
import { recommendationsApi } from "../api/recommendations";
import { useAuth } from "./useAuth";

export function useRecommendations(limit = 10) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["recommendations", limit],
    queryFn: () => recommendationsApi.get(limit).then((r) => r.data),
    enabled: isAuthenticated,
  });
}
