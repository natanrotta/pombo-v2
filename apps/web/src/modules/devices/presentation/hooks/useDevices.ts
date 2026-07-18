import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/core/di/repositories";
import { queryKeys } from "@/core/query/queryKeys";
import { useErrorHandler } from "@/core/query/useErrorHandler";
import type {
  CreateDeviceInput,
  UpdateDeviceWebhooksInput,
} from "@/modules/devices/domain/entities/Device";

/** WhatsApp rotates the pairing QR roughly every few seconds; poll to match. */
const QR_POLL_INTERVAL_MS = 3_000;

/** The device list (GET /devices). Small, non-paginated per account. */
export function useDevicesList() {
  return useQuery({
    queryKey: queryKeys.devices.list(),
    queryFn: () => repositories.devices.list(),
  });
}

/** A single device's authoritative state (GET /devices/:id). */
export function useDeviceDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id),
    queryFn: () => repositories.devices.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  return useMutation({
    mutationFn: (input: CreateDeviceInput) =>
      repositories.devices.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.list() }),
    onError: (error) => handleError(error),
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  return useMutation({
    mutationFn: (id: string) => repositories.devices.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.list() }),
    onError: (error) => handleError(error),
  });
}

export function useConnectDevice() {
  const { handleError } = useErrorHandler();
  return useMutation({
    mutationFn: (id: string) => repositories.devices.connect(id),
    onError: (error) => handleError(error),
  });
}

/**
 * Polls the pairing QR (GET /devices/:id/qr) while `enabled` (the connect modal
 * is open). The response carries the live `status`, so the modal reacts to
 * CONNECTED without a separate query.
 */
export function useDeviceQr(id: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.devices.qr(id),
    queryFn: () => repositories.devices.getQr(id),
    enabled: enabled && Boolean(id),
    refetchInterval: enabled ? QR_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    gcTime: 0,
  });
}

export function useUpdateDeviceWebhooks(id: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  return useMutation({
    mutationFn: (input: UpdateDeviceWebhooksInput) =>
      repositories.devices.updateWebhooks(id, input),
    onSuccess: (device) => {
      queryClient.setQueryData(queryKeys.devices.detail(id), device);
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.list() });
    },
    onError: (error) => handleError(error),
  });
}
