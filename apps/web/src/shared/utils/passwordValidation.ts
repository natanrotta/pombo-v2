const PASSWORD_RULES = [
  (p: string) => p.length >= 8,
  (p: string) => /[A-Z]/.test(p),
  (p: string) => /[a-z]/.test(p),
  (p: string) => /\d/.test(p),
  (p: string) => /[^A-Za-z0-9]/.test(p),
];

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((test) => test(password));
}
