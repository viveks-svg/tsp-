/**
 * User type matching the backend `formatUser()` response shape.
 */
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  /** Admins only: SUPER_ADMIN | MANAGER | SUPPORT | CONTENT */
  staffRole?: string | null;
  /** Admins only: what their staff role allows (see backend common/permissions.ts). */
  permissions?: string[];
  avatarUrl: string | null;
  firebaseUid: string | null;
  authProvider: string | null;
  /** Sign-in methods and how each is proven. */
  emailVerified?: boolean;
  phoneVerified?: boolean;
  pendingEmail?: string | null;
  hasPassword?: boolean;
  twoStepEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Response from GET /auth/me */
export interface AuthMeResponse {
  user: User;
  walletBalance: number;
}


/** Staff / astrologer sign-in that still needs its second step. */
export interface TwoStepChallenge {
  twoStep: "VERIFY" | "SETUP";
  challengeToken: string;
  name?: string | null;
}

/** Response from POST /auth/login, POST /auth/signup, etc. */
export interface AuthTokenResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  walletBalance: number;
}
