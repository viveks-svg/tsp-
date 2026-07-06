import { Check, X } from "lucide-react";
import { getPasswordStrength } from "@/lib/validations/validators";

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export default function PasswordStrengthIndicator({ password = "" }: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);

  const requirements = [
    { label: "At least 8 characters", met: strength.hasMinLength },
    { label: "One uppercase letter", met: strength.hasUppercase },
    { label: "One lowercase letter", met: strength.hasLowercase },
    { label: "One number", met: strength.hasNumber },
    { label: "One special character", met: strength.hasSpecial },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 p-3 bg-cream/30 rounded-lg border border-border">
      <p className="text-xs font-semibold text-dark">Password Requirements:</p>
      <ul className="space-y-1">
        {requirements.map((req, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className={req.met ? "text-emerald-700" : "text-paragraph"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
