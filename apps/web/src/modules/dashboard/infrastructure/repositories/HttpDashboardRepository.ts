import { httpClient } from "@/core/http/httpClient";
import type { DashboardSummary } from "../../domain/entities/DashboardSummary";
import type { DashboardRepository } from "../../domain/repositories/DashboardRepository";

export class HttpDashboardRepository implements DashboardRepository {
  getSummary(): Promise<DashboardSummary> {
    return httpClient.get<never, DashboardSummary>("/dashboard/summary");
  }
}
