/**
 * Frontend mirror of the API `PhoneResponseDTO`. Embedded inside Contact /
 * Workplace / User shapes. `e164` is the canonical match key; `countryCode`
 * drives the flag the UI renders; `nationalNumber` is what shows up in the
 * input control.
 */
export interface Phone {
  countryCode: string;
  nationalNumber: string;
  e164: string;
}

/**
 * Wire-format input used by every create/update mutation that accepts a
 * phone. Always paired — clearing is done at the parent level via
 * `phone: null`. The server derives `e164`; the FE never composes it.
 */
export interface PhoneInput {
  countryCode: string;
  nationalNumber: string;
}
