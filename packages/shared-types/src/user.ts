/**
 * Wire-format response shape for a `user`. Dates are emitted as ISO strings.
 * Single-user boilerplate: no account/role/membership fields.
 */
export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  status: string;
  /** ISO-8601. */
  createdAt: string;
  /** ISO-8601. */
  updatedAt: string;
}
