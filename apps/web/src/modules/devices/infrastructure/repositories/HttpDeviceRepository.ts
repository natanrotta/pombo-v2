import { httpClient } from "@/core/http/httpClient";
import type { DeviceRepository } from "@/modules/devices/domain/repositories/DeviceRepository";
import type {
  Device,
  CreateDeviceInput,
  CreatedDevice,
  UpdateDeviceWebhooksInput,
  DeviceQr,
  ConnectDeviceResult,
} from "@/modules/devices/domain/entities/Device";

// The httpClient response interceptor unwraps `{ ok, data }` → each call
// resolves to the inner `data` directly.
export class HttpDeviceRepository implements DeviceRepository {
  list(): Promise<Device[]> {
    return httpClient.get<never, Device[]>("/devices");
  }

  getById(id: string): Promise<Device> {
    return httpClient.get<never, Device>(`/devices/${id}`);
  }

  create(input: CreateDeviceInput): Promise<CreatedDevice> {
    return httpClient.post<CreateDeviceInput, CreatedDevice>("/devices", input);
  }

  updateWebhooks(
    id: string,
    input: UpdateDeviceWebhooksInput,
  ): Promise<Device> {
    return httpClient.patch<UpdateDeviceWebhooksInput, Device>(
      `/devices/${id}/webhooks`,
      input,
    );
  }

  connect(id: string): Promise<ConnectDeviceResult> {
    return httpClient.post<never, ConnectDeviceResult>(
      `/devices/${id}/connect`,
    );
  }

  getQr(id: string): Promise<DeviceQr> {
    return httpClient.get<never, DeviceQr>(`/devices/${id}/qr`);
  }

  delete(id: string): Promise<void> {
    return httpClient.delete<never, void>(`/devices/${id}`);
  }
}
