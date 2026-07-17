import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BaseEntity } from "@/core/domain/CrudRepository";
import type { EntityQueryKeysWithDetail } from "@/core/query/entityQueryKeys";
import { useErrorHandler } from "@/core/query/useErrorHandler";

interface UseEntityDetailOptions<T extends BaseEntity, TCreate, TUpdate> {
  repo: {
    getById(id: string): Promise<T | null>;
    create(input: TCreate): Promise<T>;
    update(id: string, input: TUpdate): Promise<T>;
  };
  keys: EntityQueryKeysWithDetail;
  id?: string;
  errorMessages: {
    create: string;
    update: string;
  };
}

export function useEntityDetail<T extends BaseEntity, TCreate, TUpdate>({
  repo,
  keys,
  id,
  errorMessages,
}: UseEntityDetailOptions<T, TCreate, TUpdate>) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const {
    data: entity = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: keys.detail(id!),
    queryFn: () => repo.getById(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (input: TCreate) => repo.create(input),
    onSuccess: (created) => {
      queryClient.setQueryData(keys.detail(created.id), created);
      // Append optimistically so any list-derived UI (limit counters,
      // filters) sees the new entity before the refetch lands.
      queryClient.setQueryData<T[]>(keys.list(), (prev) => (prev ? [...prev, created] : prev));
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.search() });
    },
    onError: (error) => handleError(error, errorMessages.create),
  });

  const updateMutation = useMutation({
    mutationFn: (input: TUpdate) => repo.update(id!, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.detail(id!), updated);
      // Patch the list cache so anything that derives state from the
      // full list (limit counters, badges) reads fresh values without
      // waiting for the refetch. Without this the user can keep
      // toggling defaults across pages and overshoot the server limit
      // because the list still shows the previous state.
      queryClient.setQueryData<T[]>(keys.list(), (prev) =>
        prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : prev
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.search() });
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
    onError: (error) => handleError(error, errorMessages.update),
  });

  return {
    entity,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
