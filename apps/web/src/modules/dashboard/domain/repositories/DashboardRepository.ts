import type { DashboardSummary } from "../entities/DashboardSummary";

export interface DashboardRepository {
  /** Aggregated dashboard payload. Wire this to your product's summary
   *  endpoint; the boilerplate returns an empty stat list. */
  getSummary(): Promise<DashboardSummary>;
}
