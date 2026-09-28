import type { Response } from "express";

/** The httpOnly session cookie the website signs in with (same site as the API, via nginx). */
export function setAuthCookie(res: Response, accessToken: string): void {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Same site as the website (nginx serves both), so "lax" works and blocks cross-site form posts.
    sameSite: "lax",
    path: "/",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/** Shared by signup, reset and set-password forms. */
export const STRONG_PASSWORD = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';])/;
export const STRONG_PASSWORD_MESSAGE =
  "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
