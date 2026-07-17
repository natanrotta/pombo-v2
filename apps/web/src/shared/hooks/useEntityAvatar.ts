import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BaseEntity } from "@/core/domain/CrudRepository";
import type { EntityQueryKeysWithDetail } from "@/core/query/entityQueryKeys";
import { useErrorHandler } from "@/core/query/useErrorHandler";

interface UseEntityAvatarOptions<T extends BaseEntity> {
  repo: {
    uploadAvatar(id: string, file: File): Promise<T>;
    deleteAvatar(id: string): Promise<T>;
  };
  keys: EntityQueryKeysWithDetail;
  id?: string;
  errorMessages: {
    upload: string;
    remove: string;
  };
}

/**
 * Upload / remove an entity's avatar and keep the detail + list caches in
 * sync. Mirrors `useEntityDetail`'s cache strategy: `setQueryData` for the
 * just-mutated entity (instant header update) + a background invalidation of
 * the search/list keys so any list-row avatar refreshes. The caller owns the
 * optimistic preview and the remove confirmation; this hook only does the
 * network call + cache reconciliation.
 */
export function useEntityAvatar<T extends BaseEntity>({
  repo,
  keys,
  id,
  errorMessages,
}: UseEntityAvatarOptions<T>) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const syncCaches = (updated: T) => {
    queryClient.setQueryData(keys.detail(id!), updated);
    queryClient.setQueryData<T[]>(keys.list(), (prev) =>
      prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : prev
    );
  };

  const settle = () => {
    queryClient.invalidateQueries({ queryKey: keys.search() });
    queryClient.invalidateQueries({ queryKey: keys.list() });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => repo.uploadAvatar(id!, file),
    onSuccess: syncCaches,
    onSettled: settle,
    onError: (error) => handleError(error, errorMessages.upload),
  });

  const removeMutation = useMutation({
    mutationFn: () => repo.deleteAvatar(id!),
    onSuccess: syncCaches,
    onSettled: settle,
    onError: (error) => handleError(error, errorMessages.remove),
  });

  return {
    uploadAvatar: uploadMutation.mutateAsync,
    removeAvatar: removeMutation.mutateAsync,
    isAvatarBusy: uploadMutation.isPending || removeMutation.isPending,
  };
}
