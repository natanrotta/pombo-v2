const UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

export function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhdw])$/);

  if (!match) {
    return 7 * 86_400_000;
  }

  const amount = parseInt(match[1]!, 10);
  const unit = match[2]!;

  return amount * UNITS[unit]!;
}
