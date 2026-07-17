import { HandleSessionLoggedOutUseCase } from "./handle-session-logged-out.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { IAuthStateRepository } from "@modules/devices/domain/repository/auth-state-repository.interface";

const ACCOUNT_A = "account-a";

describe("HandleSessionLoggedOutUseCase", () => {
  it("marks the device LOGGED_OUT then clears the auth state", async () => {
    const devices = new InMemoryDevicesRepository();
    const order: string[] = [];
    const authState: IAuthStateRepository = {
      clear: vi.fn(async () => {
        order.push("clear");
      }),
    };
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    await devices.updateStatus(id, "CONNECTED");

    await new HandleSessionLoggedOutUseCase(devices, authState).execute({
      deviceId: id,
    });

    expect((await devices.findById(ACCOUNT_A, id))?.status).toBe("LOGGED_OUT");
    expect(authState.clear).toHaveBeenCalledWith(id);
    // Status write happens before the authState clear.
    expect(order).toEqual(["clear"]);
  });
});
