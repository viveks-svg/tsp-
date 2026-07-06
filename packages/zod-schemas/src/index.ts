import { z } from "zod";

// ─── Regex Patterns ───────────────────────────────────────────────────────────

const ALPHA_ONLY = /^[a-zA-Z\s]+$/;
const DIGITS_ONLY = /^\d+$/;
const PHONE_10_DIGITS = /^\d{10}$/;
const PINCODE_6_DIGITS = /^\d{6}$/;
const PASSWORD_UPPERCASE = /[A-Z]/;
const PASSWORD_LOWERCASE = /[a-z]/;
const PASSWORD_DIGIT = /[0-9]/;
const PASSWORD_SPECIAL = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';]/;
const HH_MM_FORMAT = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// ─── Field-Level Validators ───────────────────────────────────────────────────

/** Alphabetic name with spaces only. No numbers, no special chars. */
export const nameValidator = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must not exceed 60 characters")
  .regex(ALPHA_ONLY, "Name must contain only letters and spaces");

/** Exactly 10 digits, no spaces, no country code. */
export const phoneValidator = z
  .string()
  .trim()
  .regex(PHONE_10_DIGITS, "Phone must be exactly 10 digits");

/** RFC-compliant email. */
export const emailValidator = z
  .string()
  .trim()
  .email("Please enter a valid email address");

/**
 * Strong password: min 8 chars, at least one uppercase, lowercase, digit, special char.
 */
export const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(PASSWORD_UPPERCASE, "Password must contain at least one uppercase letter")
  .regex(PASSWORD_LOWERCASE, "Password must contain at least one lowercase letter")
  .regex(PASSWORD_DIGIT, "Password must contain at least one number")
  .regex(PASSWORD_SPECIAL, "Password must contain at least one special character");

/** Gender enum. */
export const genderValidator = z.enum(["Male", "Female", "Other"], {
  errorMap: () => ({ message: "Please select a gender" }),
});

/** ISO date string not in the future and not before 1900-01-01. */
export const dateOfBirthValidator = z
  .string()
  .min(1, "Date of birth is required")
  .refine(
    (val) => !isNaN(Date.parse(val)),
    "Please enter a valid date"
  )
  .refine(
    (val) => new Date(val) <= new Date(),
    "Date of birth cannot be in the future"
  )
  .refine(
    (val) => new Date(val) >= new Date("1900-01-01"),
    "Date of birth cannot be before 1900"
  );

/** Location: non-empty, no purely numeric, between 2-200 chars. */
export const locationValidator = z
  .string()
  .trim()
  .min(2, "Location must be at least 2 characters")
  .max(200, "Location is too long")
  .refine(
    (val) => !DIGITS_ONLY.test(val),
    "Location cannot be purely numeric"
  );

/** Business name: min 2 chars, not purely numeric. */
export const businessNameValidator = z
  .string()
  .trim()
  .min(2, "Business name must be at least 2 characters")
  .max(100, "Business name is too long")
  .refine(
    (val) => !DIGITS_ONLY.test(val),
    "Business name cannot be purely numeric"
  );

/** Indian 6-digit PIN code. */
export const pincodeValidator = z
  .string()
  .trim()
  .regex(PINCODE_6_DIGITS, "PIN code must be exactly 6 digits");

/** Address: 5–500 chars. */
export const addressValidator = z
  .string()
  .trim()
  .min(5, "Address must be at least 5 characters")
  .max(500, "Address must not exceed 500 characters");

/** Language code: one of the supported codes. */
export const languageCodeValidator = z.enum(
  ["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "or", "as"],
  { errorMap: () => ({ message: "Please select a supported language" }) }
);

/** HH:MM 24-hour format. */
export const timeValidator = z
  .string()
  .regex(HH_MM_FORMAT, "Time must be in HH:MM 24-hour format");

// ─── Composite Schemas ────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  name: nameValidator,
  email: emailValidator,
  password: passwordValidator,
  phone: z.string().optional().refine(
    (val) => !val || PHONE_10_DIGITS.test(val),
    "Phone must be exactly 10 digits"
  ),
  role: z.enum(["USER", "ASTROLOGER", "ADMIN"]).optional().default("USER"),
});

export const BookConsultationSchema = z.object({
  astrologerId: z.string().uuid("Invalid astrologer ID"),
  scheduledAt: z.string().datetime("Invalid date format"),
});

export const UpdateProfileSchema = z.object({
  gender: genderValidator.optional(),
  preferredLanguage: languageCodeValidator.optional(),
  dob: dateOfBirthValidator.optional(),
  tob: timeValidator.optional(),
  pob: locationValidator.optional(),
  timezone: z.string().optional(),
});

export const KundliGenerateSchema = z.object({
  name: nameValidator,
  gender: genderValidator,
  birthDate: dateOfBirthValidator,
  birthTime: timeValidator,
  birthPlace: locationValidator,
});

export const CreateBookingSchema = z.object({
  fullName: nameValidator,
  email: emailValidator,
  phone: phoneValidator,
  businessName: businessNameValidator.optional(),
  spaceType: z.string().min(1, "Space type is required").optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
  dateOfBirth: dateOfBirthValidator.optional(),
  timeOfBirth: timeValidator.optional(),
  placeOfBirth: locationValidator.optional(),
});

export const ShopCheckoutSchema = z.object({
  customerName: nameValidator,
  customerEmail: emailValidator,
  customerPhone: phoneValidator,
  shippingAddress: addressValidator,
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: pincodeValidator,
});

export const HoroscopeInputSchema = z.object({
  name: nameValidator.optional(),
  birthDate: dateOfBirthValidator,
  birthPlace: locationValidator.optional(),
  gender: genderValidator.optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type BookConsultationInput = z.infer<typeof BookConsultationSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type KundliGenerateInput = z.infer<typeof KundliGenerateSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ShopCheckoutInput = z.infer<typeof ShopCheckoutSchema>;
export type HoroscopeInput = z.infer<typeof HoroscopeInputSchema>;

