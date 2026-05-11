import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api/events";

export function useEvents(params) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => eventsApi.list(params).then((r) => r.data),
  });
}

export function useEvent(id) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsApi.detail(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => eventsApi.categories().then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useRegisterEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId) => eventsApi.register(eventId).then((r) => r.data),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => eventsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => eventsApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
