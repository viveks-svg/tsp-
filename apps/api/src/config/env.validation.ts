/**
 * Refuses to start in production without the secrets the app depends on,
 * instead of quietly running with a guessable default.
 */
export function validateEnv(env: Record<string, unknown>) {
  if (env.NODE_ENV !== "production") return env;

  const problems: string[] = [];
  const need = (name: string, minLength = 1) => {
    const value = String(env[name] ?? "");
    if (value.length < minLength) problems.push(minLength > 1 ? `${name} (at least ${minLength} characters)` : name);
  };
  need("JWT_SECRET", 32);
  need("SETTINGS_ENCRYPTION_KEY", 32);
  need("DATABASE_URL");
  need("FRONTEND_URL");

  if (problems.length) {
    throw new Error(`Missing or too short in the production environment: ${problems.join(", ")}`);
  }
  return env;
}
