import { useState, type ChangeEvent } from "react";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Text-field values with per-field errors; editing a field clears its error. */
export const useFormFields = <T extends Record<string, string>>(initial: T) => {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  /** Props for a TextField bound to `name`. */
  const field = (name: keyof T) => ({
    value: values[name],
    error: errors[name],
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
    },
  });

  /** Shows the given validation errors; returns true when there are none. */
  const check = (found: FieldErrors<T>) => {
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  return { values, setValues, setErrors, field, check };
};
