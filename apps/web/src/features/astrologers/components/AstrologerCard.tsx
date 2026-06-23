"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import OnlineIndicator from "@/features/astrologers/components/OnlineIndicator";
import type { Astrologer } from "@/types/astrologer";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { ROUTES } from "@/lib/constants/routes";

interface AstrologerCardProps {
  astrologer: Astrologer;
  className?: string;
  /** 'chat' (default) or 'call' — determines which action the primary button triggers */
  mode?: "chat" | "call";
}

export function AstrologerCardSkeleton() {
  return (
    <Card className="rounded-card shadow-card border-border">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-10 flex-1 rounded-button" />
        <Skeleton className="h-10 flex-1 rounded-button" />
      </CardFooter>
    </Card>
  );
}

export default function AstrologerCard({
  astrologer,
  className,
  mode = "chat",
}: AstrologerCardProps) {
  const router = useRouter();
  const { isAuthenticated, setPendingAction } = useAuth();
  const authModal = useAuthModal();
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const withAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
      return;
    }

    setPendingAction(action);
    authModal.open("login");
  };

  const createConsultation = async () => {
    try {
      setBooking(true);
      setBookingError(null);
      // 1. Create a consultation (scheduled for immediate start)
      const cons = await apiClient.post<{ id: string }>(ENDPOINTS.CONSULTATIONS.CREATE, {
        astrologerId: astrologer.id,
        scheduledAt: new Date(Date.now() + 5 * 1000).toISOString(),
      });
      
      // 2. Start it immediately to transition status to ACTIVE and spawn ChatThread
      await apiClient.post(ENDPOINTS.CONSULTATIONS.START(cons.id));
      
      // 3. Redirect directly to the live WebSocket chat room
      router.push(`/consultations/${cons.id}/chat`);
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Unable to start this chat session."
      );
    } finally {
      setBooking(false);
    }
  };

  const createCallConsultation = async () => {
    try {
      setBooking(true);
      setBookingError(null);

      // 1. Initiate call via the call endpoint (creates CALL consultation + CallSession)
      const result = await apiClient.post<{ consultationId: string }>(
        ENDPOINTS.CONSULTATIONS.CALL_INITIATE,
        { astrologerId: astrologer.id },
      );

      // 2. Redirect to the call room
      router.push(`/consultations/${result.consultationId}/call`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to start this call.";
      if (msg.includes("ASTROLOGER_BUSY")) {
        setBookingError("This astrologer is currently on another call. Please try again later.");
      } else {
        setBookingError(msg);
      }
    } finally {
      setBooking(false);
    }
  };

  const handleBooking = () => {
    withAuth(() => {
      void createConsultation();
    });
  };

  const handleCallBooking = () => {
    withAuth(() => {
      void createCallConsultation();
    });
  };

  return (
    <Card
      className={cn(
        "rounded-card shadow-card border-border card-hover overflow-hidden",
        className
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center font-heading font-bold text-navy text-lg">
              {astrologer.initials}
            </div>
            <OnlineIndicator
              isOnline={astrologer.isOnline}
              showLabel={false}
              className="absolute -bottom-0.5 -right-0.5 bg-card rounded-full p-0.5"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold text-dark truncate">
              {astrologer.name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="text-sm font-medium text-dark">
                {astrologer.rating}
              </span>
              {astrologer.reviewCount > 0 && (
                <span className="text-xs text-muted">
                  ({astrologer.reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-1">
              {astrologer.experienceYears > 0
                ? `${astrologer.experienceYears} yrs exp - `
                : ""}
              ₹{astrologer.pricePerMin}/min
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {astrologer.specialties.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-cream text-navy text-[10px] font-poppins"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <p className="text-xs text-paragraph">
          <span className="font-medium text-dark">Languages: </span>
          {astrologer.languages.join(", ") || "Not specified"}
        </p>

        {bookingError && (
          <p className="mt-3 text-xs font-medium text-rose-600">
            {bookingError}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0 pb-5">
        <Button
          variant={mode === "chat" ? "solid" : "outline"}
          size="sm"
          className="flex-1 gap-1.5 rounded-button"
          disabled={!astrologer.isOnline || booking}
          onClick={handleBooking}
        >
          <MessageCircle className="w-4 h-4" />
          {booking && mode === "chat" ? "Booking..." : "Chat Now"}
        </Button>
        <Button
          variant={mode === "call" ? "solid" : "outline"}
          size="sm"
          className="flex-1 gap-1.5 rounded-button"
          disabled={!astrologer.isOnline || booking}
          onClick={handleCallBooking}
        >
          <Phone className="w-4 h-4" />
          {booking && mode === "call" ? "Calling..." : "Call Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
