/**
 * Wire-format `address` shape — mirrors `AddressResponseDTO` from
 * `@pombo/shared-types` 1:1. Dates are ISO strings; every field
 * is nullable because the user can save partial info at any time.
 */
export interface Address {
  id: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  /** ISO 3166-1 alpha-2 (e.g. "BR", "US"). */
  countryCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape sent on `PUT /auth/profile` under the `address` key. Every field is
 * optional and clearable via `null`. The full-replace contract means missing
 * fields collapse to `null` server-side.
 *
 * The wrapping `address?` on the parent payload accepts:
 *  - `undefined` → don't touch the address row
 *  - `null`      → soft-delete the address row + clear the parent FK
 *  - object      → upsert with the fields below
 */
export interface AddressInput {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
}

/** Keys of the address payload — useful for typed handlers. */
export type AddressFieldKey = keyof AddressInput;

export const ADDRESS_FIELD_KEYS: ReadonlyArray<AddressFieldKey> = [
  "street",
  "number",
  "complement",
  "district",
  "city",
  "state",
  "postalCode",
  "countryCode",
];

/**
 * Normalizes a saved `Address` (or `null`) into the partial-edit shape used
 * by `<AddressSection>`. Keeps both detail pages in sync — neither needs to
 * inline this mapping.
 */
export function addressToInput(addr: Address | null): AddressInput | null {
  if (!addr) return null;
  return {
    street: addr.street ?? null,
    number: addr.number ?? null,
    complement: addr.complement ?? null,
    district: addr.district ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    postalCode: addr.postalCode ?? null,
    countryCode: addr.countryCode ?? null,
  };
}
