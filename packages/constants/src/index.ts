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
