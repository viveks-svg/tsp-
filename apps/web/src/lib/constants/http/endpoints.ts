/**
 * Centralized API endpoints for the web client.
 */
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    REFRESH: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
    FIREBASE_PHONE: "/auth/firebase/phone",
    FIREBASE_GOOGLE: "/auth/firebase/google",
    FIREBASE_APPLE: "/auth/firebase/apple",
  },

  // Users
  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    FCM_TOKEN: "/users/fcm-token",
  },

  // Consultations
  CONSULTATIONS: {
    LIST: "/consultations",
    CREATE: "/consultations",
    START: (id: string) => `/consultations/${id}/start`,
    COMPLETE: (id: string) => `/consultations/${id}/complete`,
    CANCEL: (id: string) => `/consultations/${id}/cancel`,
    // Call endpoints
    CALL_INITIATE: "/consultations/call/initiate",
    CALL_ACCEPT: (id: string) => `/consultations/${id}/call/accept`,
    CALL_REJECT: (id: string) => `/consultations/${id}/call/reject`,
    CALL_END: (id: string) => `/consultations/${id}/call/end`,
    CALL_TOKEN: (id: string) => `/consultations/${id}/call/token`,
    CALL_SESSION: (id: string) => `/consultations/${id}/call/session`,
    CALL_HISTORY: "/consultations/call/history",
  },

  // Astrologers
  ASTROLOGERS: {
    LIST: "/astrologers",
    DETAIL: (id: string) => `/astrologers/${id}`,
    ME_AVAILABILITY_RULES: "/astrologers/me/availability/rules",
  },

  // Horoscope
  HOROSCOPE: {
    GET: (sign: string, period: string) => `/horoscope/${sign}/${period}`,
    PERSONALIZED: "/horoscope/personalized",
  },

  // Kundli
  KUNDLI: {
    GENERATE: "/kundli/generate",
  },

  // Wallet
  WALLET: {
    DETAIL: "/wallet",
    ADD_FUNDS: "/wallet/add-funds",
  },

  // Payments
  PAYMENTS: {
    ORDERS: "/payments/orders",
    CREATE_ORDER: "/payments/orders",
    VERIFY: "/payments/verify",
    REFUNDS: "/payments/refunds",
  },

  OTP: {
    SEND: "/otp/send",
    VERIFY: "/otp/verify",
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/notifications",
    READ_ALL: "/notifications/read-all",
    READ: (id: string) => `/notifications/${id}/read`,
  },
} as const;
