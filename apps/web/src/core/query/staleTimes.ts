/**
 * Tiers de stale-time para TanStack Query.
 *
 * - `default` casa com o default do queryClient — entidades transacionais
 *   do dia a dia.
 * - `reference` é mais agressivo para dados que mudam raramente
 *   (tags, configurações, listas de referência).
 * - `volatile` é mais curto para dados muito dinâmicos
 *   (métricas, dashboards realtime).
 * - `subscription` documenta o contrato de "check periódico de status"
 *   (assinatura ativa / cancelada) — entre default e volatile.
 */
export const STALE_TIMES = {
  default: 60_000,
  reference: 5 * 60_000,
  volatile: 15_000,
  subscription: 30_000,
} as const;

/**
 * Tiers de garbage-collection (`gcTime`) — quanto tempo uma query INATIVA
 * permanece em memória depois que nenhum componente a observa mais.
 *
 * Regra: `gcTime` SEMPRE > `staleTime` correspondente. Se baterem, o cache
 * é evictado no exato momento que vira stale, forçando refetch a cada
 * navegação. Use estes tiers quando um hook precisar sobrescrever o
 * gcTime default do queryClient (ex: reference data crítica para UX
 * de navegação rápida).
 */
export const GC_TIMES = {
  default: 5 * 60_000,
  reference: 20 * 60_000,
  volatile: 60_000,
  subscription: 5 * 60_000,
} as const;
