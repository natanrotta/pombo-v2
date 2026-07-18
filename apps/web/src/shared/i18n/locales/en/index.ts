// Aggregated en bundle — imported ONLY via dynamic import() from
// shared/i18n/index.ts so the whole language ships as one lazy chunk.
import common from "./common.json";
import auth from "./auth.json";
import settings from "./settings.json";
import devices from "./devices.json";
import sandbox from "./sandbox.json";

export default {
  common: common,
  auth: auth,
  settings: settings,
  devices: devices,
  sandbox: sandbox,
} as const;
