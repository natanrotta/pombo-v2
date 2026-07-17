export function unformatDocument(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatDocument(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  // Mais que CNPJ — retorna sem máscara
  if (digits.length > 14) {
    return digits;
  }

  // CNPJ: XX.XXX.XXX/XXXX-XX
  if (digits.length > 11) {
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  // CPF: XXX.XXX.XXX-XX
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

export function formatDocumentDisplay(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 || digits.length === 14) {
    return formatDocument(digits);
  }
  return raw;
}
