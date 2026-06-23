export type UserRole = "USER" | "ASTROLOGER" | "ADMIN";

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AstrologerDto {
  id: string;
  userId: string;
  bio: string;
  skills: string[];
  languages: string[];
  pricingPerMin: number;
  rating: number;
  isAvailable: boolean;
}

export interface ConsultationDto {
  id: string;
  userId: string;
  astrologerId: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  durationMin?: number;
  cost?: number;
  scheduledAt: string;
  createdAt: string;
}
