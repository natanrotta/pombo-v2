import { useCallback, useMemo, useRef, useState } from "react";

export type ValidationSchema<T> = {
  [K in keyof T]?: (value: T[K], formData: T) => string | null;
};

export function useFormState<T extends Record<string, unknown>>(
  initialValues: T,
  validationSchema?: ValidationSchema<T>
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const initialRef = useRef(initialValues);

  const isDirty = useMemo(() => {
    const initial = initialRef.current;
    return Object.keys(initial).some((key) => formData[key as keyof T] !== initial[key as keyof T]);
  }, [formData]);

  const setField = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setTouched((prev) => ({ ...prev, [field]: true }));

      if (validationSchema?.[field]) {
        setErrors((prev) => {
          const error = validationSchema[field]!(value, { ...formData, [field]: value } as T);
          if (error) return { ...prev, [field]: error };
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [formData, validationSchema]
  );

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    if (!validationSchema) return true;
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const key of Object.keys(validationSchema) as Array<keyof T>) {
      const validator = validationSchema[key];
      if (!validator) continue;
      const error = validator(formData[key], formData);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validationSchema]);

  const reset = useCallback((values?: T) => {
    const next = values ?? initialRef.current;
    setFormData(next);
    setErrors({});
    setTouched({});
    if (values) {
      initialRef.current = values;
    }
  }, []);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  return {
    formData,
    setField,
    reset,
    errors,
    setError,
    clearError,
    touched,
    isDirty,
    hasErrors,
    validate,
  };
}
