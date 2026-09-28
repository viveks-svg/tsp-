import { SetMetadata } from "@nestjs/common";
import type { Permission } from "../permissions";

export const PERMISSION_KEY = "permission";

/** The staff permission an admin endpoint needs (method-level overrides class-level). */
export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_KEY, permission);
