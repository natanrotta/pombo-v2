/**
 * Liveness result for a configured external dependency, shared by the provider
 * ports that the admin status panel probes (storage, billing). `configured` is
 * false when credentials are absent (no probe attempted); `reachable` reflects
 * an actual probe call when configured. Invariant: `configured: false` always
 * implies `reachable: false` (no call was made).
 */
export interface ExternalDependencyHealth {
  configured: boolean;
  reachable: boolean;
}
