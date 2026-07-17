import { ZodIssueCode } from "zod";
import { createZodErrorMap } from "./zod-error-map";

const mockT = vi.fn((key: string) => key);

vi.mock("./index", () => ({
  i18n: { t: (...args: any[]) => (mockT as any)(...args) },
}));

describe("createZodErrorMap", () => {
  const errorMap = createZodErrorMap("pt-BR");
  const ctx = { defaultError: "Invalid", data: undefined };

  beforeEach(() => {
    mockT.mockImplementation((key: string) => key);
  });

  describe("invalid_type", () => {
    it("should return 'required' when received is undefined", () => {
      const result = errorMap(
        {
          code: ZodIssueCode.invalid_type,
          expected: "string",
          received: "undefined",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:required",
        expect.objectContaining({ lng: "pt-BR" }),
      );
      expect(result.message).toBe("validation:required");
    });

    it("should return 'required' when received is null", () => {
      const result = errorMap(
        {
          code: ZodIssueCode.invalid_type,
          expected: "string",
          received: "null",
          path: [],
        } as any,
        ctx,
      );
      expect(result.message).toBe("validation:required");
    });

    it("should return invalidType with expected/received for type mismatch", () => {
      errorMap(
        {
          code: ZodIssueCode.invalid_type,
          expected: "string",
          received: "number",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:invalidType",
        expect.objectContaining({ expected: "string", received: "number" }),
      );
    });
  });

  describe("too_small", () => {
    it("should return 'required' for string with minimum=1", () => {
      errorMap(
        {
          code: ZodIssueCode.too_small,
          type: "string",
          minimum: 1,
          inclusive: true,
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:required",
        expect.any(Object),
      );
    });

    it("should return string.tooSmall for string with minimum>1", () => {
      errorMap(
        {
          code: ZodIssueCode.too_small,
          type: "string",
          minimum: 6,
          inclusive: true,
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:string.tooSmall",
        expect.objectContaining({ minimum: 6 }),
      );
    });

    it("should return number.tooSmall for number", () => {
      errorMap(
        {
          code: ZodIssueCode.too_small,
          type: "number",
          minimum: 0,
          inclusive: true,
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:number.tooSmall",
        expect.objectContaining({ minimum: 0 }),
      );
    });

    it("should return array.tooSmall for array", () => {
      errorMap(
        {
          code: ZodIssueCode.too_small,
          type: "array",
          minimum: 1,
          inclusive: true,
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:array.tooSmall",
        expect.objectContaining({ minimum: 1 }),
      );
    });
  });

  describe("too_big", () => {
    it("should return string.tooBig for string", () => {
      errorMap(
        {
          code: ZodIssueCode.too_big,
          type: "string",
          maximum: 200,
          inclusive: true,
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:string.tooBig",
        expect.objectContaining({ maximum: 200 }),
      );
    });

    it("should return number.tooBig for number", () => {
      errorMap(
        {
          code: ZodIssueCode.too_big,
          type: "number",
          maximum: 100,
          inclusive: true,
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:number.tooBig",
        expect.objectContaining({ maximum: 100 }),
      );
    });
  });

  describe("invalid_string", () => {
    it("should return string.email for email validation", () => {
      errorMap(
        {
          code: ZodIssueCode.invalid_string,
          validation: "email",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:string.email",
        expect.any(Object),
      );
    });

    it("should return string.uuid for uuid validation", () => {
      errorMap(
        {
          code: ZodIssueCode.invalid_string,
          validation: "uuid",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:string.uuid",
        expect.any(Object),
      );
    });

    it("should return string.url for url validation", () => {
      errorMap(
        {
          code: ZodIssueCode.invalid_string,
          validation: "url",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:string.url",
        expect.any(Object),
      );
    });

    it("should return string.invalid for other string validations", () => {
      errorMap(
        {
          code: ZodIssueCode.invalid_string,
          validation: "regex",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:string.invalid",
        expect.any(Object),
      );
    });
  });

  describe("invalid_enum_value", () => {
    it("should return invalidEnum with joined options", () => {
      errorMap(
        {
          code: ZodIssueCode.invalid_enum_value,
          options: ["A", "B", "C"],
          received: "D",
          path: [],
        } as any,
        ctx,
      );
      expect(mockT).toHaveBeenCalledWith(
        "validation:invalidEnum",
        expect.objectContaining({ options: "A, B, C" }),
      );
    });
  });

  describe("custom", () => {
    it("should return the default error", () => {
      const result = errorMap(
        { code: ZodIssueCode.custom, path: [] } as any,
        ctx,
      );
      expect(result.message).toBe("Invalid");
    });
  });

  describe("fallback", () => {
    it("should return default error for unhandled codes", () => {
      const result = errorMap(
        { code: "unrecognized_keys" as any, keys: [], path: [] } as any,
        ctx,
      );
      expect(result.message).toBe("Invalid");
    });
  });
});
