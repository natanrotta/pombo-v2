import {
  CreateUserDTOSchema,
  UpdateUserDTOSchema,
  UserIdParamSchema,
} from "./user.dto";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("CreateUserDTOSchema", () => {
  const valid = {
    name: "João Silva",
    email: "joao@email.com",
    password: "123456",
  };

  it("should pass with valid data", () => {
    expect(CreateUserDTOSchema.safeParse(valid).success).toBe(true);
  });

  it("should accept optional status", () => {
    const result = CreateUserDTOSchema.safeParse({
      ...valid,
      status: "PENDING",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing name", () => {
    const { name: _, ...noName } = valid;
    expect(CreateUserDTOSchema.safeParse(noName).success).toBe(false);
  });

  it("should reject empty name", () => {
    expect(CreateUserDTOSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("should reject invalid email", () => {
    expect(
      CreateUserDTOSchema.safeParse({ ...valid, email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("should reject password shorter than 6 characters", () => {
    expect(
      CreateUserDTOSchema.safeParse({ ...valid, password: "12345" }).success,
    ).toBe(false);
  });

  it("should reject invalid status", () => {
    expect(
      CreateUserDTOSchema.safeParse({ ...valid, status: "UNKNOWN" }).success,
    ).toBe(false);
  });
});

describe("UpdateUserDTOSchema", () => {
  it("should pass with empty object (all optional)", () => {
    expect(UpdateUserDTOSchema.safeParse({}).success).toBe(true);
  });

  it("should accept partial update with name only", () => {
    expect(UpdateUserDTOSchema.safeParse({ name: "Novo Nome" }).success).toBe(
      true,
    );
  });

  it("should reject invalid email", () => {
    expect(UpdateUserDTOSchema.safeParse({ email: "bad" }).success).toBe(false);
  });

  it("should reject short password", () => {
    expect(UpdateUserDTOSchema.safeParse({ password: "123" }).success).toBe(
      false,
    );
  });

  it("should accept valid status", () => {
    expect(UpdateUserDTOSchema.safeParse({ status: "ACTIVE" }).success).toBe(
      true,
    );
  });
});

describe("UserIdParamSchema", () => {
  it("should pass with valid UUID", () => {
    expect(UserIdParamSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  it("should reject invalid UUID", () => {
    expect(UserIdParamSchema.safeParse({ id: "invalid" }).success).toBe(false);
  });
});
