export interface FormField {
  id: string;
  label: string;
  value: string;
}

export interface FormData {
  id: string;
  createdAt: number;
  updatedAt: number;
  fields: FormField[];
}

const STORAGE_KEY = "qr_form_app_data";

// Helper to generate short 8-char uppercase alphanumeric ID
const generateShortId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const saveForm = (fields: FormField[]): FormData => {
  // Ensure uniqueness (simple check, collision unlikely for this scale)
  let newId = generateShortId();
  const existingForms = getAllForms();
  while (existingForms.some((f) => f.id === newId)) {
    newId = generateShortId();
  }

  const newForm: FormData = {
    id: newId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fields,
  };

  const updatedData = [...existingForms, newForm];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  }

  return newForm;
};

export const updateForm = (
  id: string,
  fields: FormField[],
): FormData | null => {
  const forms = getAllForms();
  const index = forms.findIndex((f) => f.id === id);

  if (index === -1) return null;

  const updatedForm = {
    ...forms[index],
    updatedAt: Date.now(),
    fields,
  };

  forms[index] = updatedForm;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  }

  return updatedForm;
};

export const getForm = (id: string): FormData | undefined => {
  const forms = getAllForms();
  return forms.find((f) => f.id === id);
};

export const getAllForms = (): FormData[] => {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};
