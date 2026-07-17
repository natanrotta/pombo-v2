import { z } from "zod";

// We test the schema directly, not the parsed env (which calls process.exit)
// Recreate the schema to test it in isolation
const envSchema = z.object({
  NODE_ENV: z
    .enum(["local", "development", "staging", "production"])
    .default("local"),
  API_PORT: z.coerce.number().default(3333),
  ALLOWED_ORIGIN: z.string().default("*"),
  PROJECT_NAME: z.string().default("boilerplate-rest-api"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  DATABASE_URL: z.string(),
  BUGSNAG_API_KEY: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const VALID_ENV = {
  DATABASE_URL: "postgresql://localhost:5432/test",
  JWT_SECRET: "test-secret",
};

describe("envSchema", () => {
  it("should pass with minimal required fields + defaults", () => {
    const result = envSchema.safeParse(VALID_ENV);
    expect(result.success).toBe(true);
    expect(result.data?.NODE_ENV).toBe("local");
    expect(result.data?.API_PORT).toBe(3333);
    expect(result.data?.LOG_LEVEL).toBe("info");
    expect(result.data?.REDIS_HOST).toBe("localhost");
    expect(result.data?.JWT_EXPIRES_IN).toBe("15m");
  });

  it("should reject invalid NODE_ENV", () => {
    const result = envSchema.safeParse({ ...VALID_ENV, NODE_ENV: "test" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid NODE_ENV values", () => {
    for (const env of ["local", "development", "staging", "production"]) {
      const result = envSchema.safeParse({ ...VALID_ENV, NODE_ENV: env });
      expect(result.success).toBe(true);
    }
  });

  it("should fail when DATABASE_URL is missing", () => {
    const result = envSchema.safeParse({ JWT_SECRET: "s" });
    expect(result.success).toBe(false);
  });

  it("should fail when JWT_SECRET is missing", () => {
    const result = envSchema.safeParse({ DATABASE_URL: "pg://localhost" });
    expect(result.success).toBe(false);
  });

  it("should coerce API_PORT from string to number", () => {
    const result = envSchema.safeParse({ ...VALID_ENV, API_PORT: "4000" });
    expect(result.success).toBe(true);
    expect(result.data?.API_PORT).toBe(4000);
  });

  it("should accept all optional fields as undefined", () => {
    const result = envSchema.safeParse(VALID_ENV);
    expect(result.success).toBe(true);
    expect(result.data?.BUGSNAG_API_KEY).toBeUndefined();
    expect(result.data?.AWS_ACCESS_KEY_ID).toBeUndefined();
    expect(result.data?.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it("should reject invalid LOG_LEVEL", () => {
    const result = envSchema.safeParse({ ...VALID_ENV, LOG_LEVEL: "verbose" });
    expect(result.success).toBe(false);
  });
});
