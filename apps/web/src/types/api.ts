export interface ApiAstrologer {
  id: string;
  bio: string;
  pricingPerMin: string | number;
  rating: number;
  isAvailable: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  expertises: Array<{
    expertise: {
      id: string;
      name: string;
    };
  }>;
  languages: Array<{
    language: {
      id: string;
      code: string;
      name: string;
    };
  }>;
}

export interface WalletTransaction {
  id: string;
  amount: string | number;
  type: "CREDIT" | "DEBIT";
  status: "PENDING" | "SUCCESS" | "FAILED";
  description: string;
  consultationId: string | null;
  createdAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  amount: string | number;
  type: "CREDIT" | "DEBIT";
  balanceAfter: string | number;
  purpose: string;
  referenceId: string | null;
  description: string;
  createdAt: string;
}

export interface WalletResponse {
  balance: string | number;
  transactions: WalletTransaction[];
  ledgerEntries: WalletLedgerEntry[];
}

export interface PaymentRefund {
  id: string;
  amount: string | number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  reason: string | null;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  gatewayTransactionId: string | null;
  amount: string | number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
  refunds: PaymentRefund[];
}

export interface PaymentOrder {
  id: string;
  amount: string | number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  gatewayProvider: string;
  gatewayOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: PaymentTransaction[];
}

export interface UserProfile {
  id: string;
  userId: string;
  timezone: string;
  preferredLanguage: string;
  dob: string | null;
  tob: string | null;
  pob: string | null;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  type: "CHAT" | "CALL";
  durationMin: number | null;
  cost: string | number | null;
  lockedPricingPerMin: string | number;
  scheduledAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  astrologer: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
}
