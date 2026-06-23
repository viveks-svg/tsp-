/**
 * User type matching the backend `formatUser()` response shape.
 */
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  avatarUrl: string | null;
  firebaseUid: string | null;
  authProvider: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response from GET /auth/me */
export interface AuthMeResponse {
  user: User;
  walletBalance: number;
}


/** Response from POST /auth/login, POST /auth/signup, etc. */
export interface AuthTokenResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  walletBalance: number;
}
