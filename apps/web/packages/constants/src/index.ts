export const ROLES = {
  USER: "USER",
  ASTROLOGER: "ASTROLOGER",
  ADMIN: "ADMIN",
} as const;

export type RoleType = keyof typeof ROLES;

export const CONSULTATION_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type ConsultationStatusType = keyof typeof CONSULTATION_STATUS;

export const TRANSACTION_TYPE = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
} as const;

export type TransactionTypeType = keyof typeof TRANSACTION_TYPE;

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export type TransactionStatusType = keyof typeof TRANSACTION_STATUS;

// ─── Validation Constants ──────────────────────────────────────────────────────

export const GENDERS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
] as const;

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const SPACE_TYPES = [
  "Office",
  "Factory",
  "Warehouse",
  "Showroom",
  "Residence",
  "Shop",
  "Flat / Apartment",
  "Plot / Land",
  "Other",
] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;
export type IndianState = (typeof INDIAN_STATES)[number];

/** Indian phone number: exactly 10 digits, preceded by +91 country code */
export const PHONE_LENGTH = 10 as const;
export const PHONE_COUNTRY_CODE = "+91" as const;

export const PASSWORD_MIN_LENGTH = 8 as const;

export const NAME_MIN_LENGTH = 2 as const;
export const NAME_MAX_LENGTH = 60 as const;

export const ADDRESS_MIN_LENGTH = 5 as const;
export const ADDRESS_MAX_LENGTH = 500 as const;

/** Indian 6-digit PIN code */
export const PINCODE_LENGTH = 6 as const;
