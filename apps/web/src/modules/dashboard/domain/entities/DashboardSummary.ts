/**
 * Minimal, generic dashboard payload for the boilerplate. Replace these
 * fields with the metrics your product cares about.
 */
export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  hint: string;
}

export interface DashboardSummary {
  stats: DashboardStat[];
}
