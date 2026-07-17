import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BaseEntity } from "@/core/domain/CrudRepository";
import type { EntityQueryKeysWithDetail } from "@/core/query/entityQueryKeys";
import { useErrorHandler } from "@/core/query/useErrorHandler";

interface UseEntityCreateOptions<T extends BaseEntity, TCreate> {
  repo: {
    create(input: TCreate): Promise<T>;
  };
  keys: EntityQueryKeysWithDetail;
  errorMessage: string;
}

/**
 * Create-only mirror de `useEntityDetail`. Mesmo onSuccess (setQueryData
 * em detail + patch optimistic na list + invalidate na search), sem
 * o `useQuery` interno de detail.
 *
 * Use em modais de criação que só precisam disparar o create — elimina
 * o observer fantasma `["entity","detail",null]` que `useEntityDetail`
 * registrava ao ser chamado com `id: undefined`.
 */
export function useEntityCreate<T extends BaseEntity, TCreate>({
  repo,
  keys,
  errorMessage,
}: UseEntityCreateOptions<T, TCreate>) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const createMutation = useMutation({
    mutationFn: (input: TCreate) => repo.create(input),
    onSuccess: (created) => {
      queryClient.setQueryData(keys.detail(created.id), created);
      // Patch optimisticamente a list pra qualquer UI derivada (counters,
      // filtros) ver a entidade nova antes do refetch.
      queryClient.setQueryData<T[]>(keys.list(), (prev) => (prev ? [...prev, created] : prev));
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.search() });
    },
    onError: (error) => handleError(error, errorMessage),
  });

  return {
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
