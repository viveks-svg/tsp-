import { z } from "zod";
import {
  nameValidator,
  phoneValidator,
  emailValidator,
  passwordValidator,
  genderValidator,
  dateOfBirthValidator,
  locationValidator,
  businessNameValidator,
  pincodeValidator,
  addressValidator,
  languageCodeValidator,
  timeValidator,
} from "@tsp/zod-schemas";

export function getErrorMessage(validator: z.ZodTypeAny, value: any): string | null {
  const result = validator.safeParse(value);
  if (result.success) return null;
  return result.error.errors[0]?.message || "Invalid value";
}

export function validateName(value: string) {
  return getErrorMessage(nameValidator, value);
}

export function validatePhone(value: string) {
  return getErrorMessage(phoneValidator, value);
}

export function validateEmail(value: string) {
  return getErrorMessage(emailValidator, value);
}

export function validatePassword(value: string) {
  return getErrorMessage(passwordValidator, value);
}

export function validateGender(value: string) {
  return getErrorMessage(genderValidator, value);
}

export function validateDateOfBirth(value: string) {
  return getErrorMessage(dateOfBirthValidator, value);
}

export function validateLocation(value: string) {
  return getErrorMessage(locationValidator, value);
}

export function validateBusinessName(value: string) {
  return getErrorMessage(businessNameValidator, value);
}

export function validatePincode(value: string) {
  return getErrorMessage(pincodeValidator, value);
}

export function validateAddress(value: string) {
  return getErrorMessage(addressValidator, value);
}

export function validateLanguage(value: string) {
  return getErrorMessage(languageCodeValidator, value);
}

export function validateTime(value: string) {
  return getErrorMessage(timeValidator, value);
}

// ─── Input Filters ────────────────────────────────────────────────────────────

/** Only allow alphabetic characters and spaces */
export function filterNameInput(value: string): string {
  return value.replace(/[^a-zA-Z\s]/g, "");
}

/** Only allow alphabetic characters and spaces (suitable for basic location inputs like city, state) */
export function filterLocationInput(value: string): string {
  return value.replace(/[^a-zA-Z\s,]/g, "");
}

/** Only allow digits */
export function filterPhoneInput(value: string): string {
  return value.replace(/\D/g, "");
}

/** Only allow digits, max length 6 */
export function filterPincodeInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

// ─── Password Strength Checker ───────────────────────────────────────────────

export interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

export function getPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';]/.test(password);

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
  };
}
