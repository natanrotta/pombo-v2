import {
  SignInDTOSchema,
  SignUpDTOSchema,
  GoogleSignInDTOSchema,
  RefreshTokenDTOSchema,
  UpdateProfileDTOSchema,
} from "./auth.dto";

describe("SignInDTOSchema", () => {
  it("should pass with valid input", () => {
    const result = SignInDTOSchema.safeParse({
      email: "user@test.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("should trim and lowercase email", () => {
    const result = SignInDTOSchema.safeParse({
      email: "  User@Test.COM  ",
      password: "secret123",
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("user@test.com");
  });

  it("should reject invalid email", () => {
    const result = SignInDTOSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = SignInDTOSchema.safeParse({
      email: "user@test.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("SignUpDTOSchema (chat-driven onboarding — name + email + password only)", () => {
  const validInput = {
    name: "John Doe",
    email: "john@test.com",
    password: "Secret1!",
  };

  it("should pass with the three required fields", () => {
    const result = SignUpDTOSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = SignUpDTOSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase", () => {
    const result = SignUpDTOSchema.safeParse({
      ...validInput,
      password: "secret1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without lowercase", () => {
    const result = SignUpDTOSchema.safeParse({
      ...validInput,
      password: "SECRET1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const result = SignUpDTOSchema.safeParse({
      ...validInput,
      password: "Secretx!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without special character", () => {
    const result = SignUpDTOSchema.safeParse({
      ...validInput,
      password: "Secret12",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = SignUpDTOSchema.safeParse({
      ...validInput,
      password: "Se1!",
    });
    expect(result.success).toBe(false);
  });

  it("should strip extra fields silently (Zod default behaviour)", () => {
    const result = SignUpDTOSchema.safeParse({
      ...validInput,
      councilNumber: "12345/SP",
      specialty: "Cardiology",
      accountName: "My Clinic",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validInput);
  });
});

describe("GoogleSignInDTOSchema (credential only — no metadata)", () => {
  it("should pass with valid credential", () => {
    const result = GoogleSignInDTOSchema.safeParse({
      credential: "google-token-123",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ credential: "google-token-123" });
  });

  it("should reject empty credential", () => {
    const result = GoogleSignInDTOSchema.safeParse({ credential: "" });
    expect(result.success).toBe(false);
  });
});

describe("RefreshTokenDTOSchema", () => {
  it("should pass with valid refreshToken", () => {
    const result = RefreshTokenDTOSchema.safeParse({
      refreshToken: "some-token",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty refreshToken", () => {
    const result = RefreshTokenDTOSchema.safeParse({ refreshToken: "" });
    expect(result.success).toBe(false);
  });

  it("should pass with an EMPTY body — the web client sends the token via the pombo_rt cookie", () => {
    // Regression guard: a required field here would 400 every cookie-only
    // refresh before the controller's cookie-first read runs.
    const result = RefreshTokenDTOSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("UpdateProfileDTOSchema", () => {
  it("should pass with partial fields", () => {
    const result = UpdateProfileDTOSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  it("should pass with empty object", () => {
    const result = UpdateProfileDTOSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept a language update", () => {
    const result = UpdateProfileDTOSchema.safeParse({ language: "en" });
    expect(result.success).toBe(true);
    expect(result.data?.language).toBe("en");
  });

  it("should reject invalid email", () => {
    const result = UpdateProfileDTOSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });
});
