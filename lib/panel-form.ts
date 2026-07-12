export function getFormRestoreKey(values?: object | null) {
  return values ? JSON.stringify(values) : "initial";
}

export function readRawFormValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function extractFormValues(
  formData: FormData,
  fields: string[],
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of fields) {
    values[field] = readRawFormValue(formData.get(field));
  }

  return values;
}
