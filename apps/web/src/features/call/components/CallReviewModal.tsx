"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants/routes";

interface CallReviewModalProps {
  consultationId: string;
  astrologerName: string;
  durationMin: number;
  cost: string;
}

/**
 * Post-call review modal — shown after a call ends.
 * Users can rate and optionally write a review, then get redirected to consultations.
 */
export default function CallReviewModal({
  consultationId,
  astrologerName,
  durationMin,
  cost,
}: CallReviewModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.post(`/consultations/${consultationId}/review`, {
        rating,
        review: reviewComment,
      });
      setSubmitted(true);
      setTimeout(() => {
        router.push(ROUTES.CONSULTATIONS);
      }, 1500);
    } catch {
      // Still redirect on failure
      router.push(ROUTES.CONSULTATIONS);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push(ROUTES.CONSULTATIONS);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        {submitted ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-dark">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-paragraph">
              Redirecting you to your consultations history...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-heading text-2xl font-bold text-dark">
                Call Completed
              </h3>
              <p className="text-xs text-paragraph mt-1.5">
                Your {durationMin} min call with{" "}
                <span className="font-semibold">{astrologerName}</span> is
                complete.
                {cost && (
                  <span className="text-navy font-semibold"> (₹{cost})</span>
                )}
              </p>
            </div>

            {/* Star rating selector */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= rating
                        ? "fill-gold text-gold"
                        : "text-border",
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Feedback Comment */}
            <div className="text-left space-y-1.5">
              <label
                htmlFor="call-review-comment"
                className="text-xs font-bold text-dark font-poppins"
              >
                Review (Optional)
              </label>
              <textarea
                id="call-review-comment"
                placeholder="Describe your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full p-3 bg-cream/30 border border-border rounded-lg text-xs font-poppins focus:outline-none focus:border-gold transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 rounded-button text-xs font-semibold font-poppins text-paragraph border border-border hover:bg-cream/50 transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-navy hover:bg-navy-hover text-white py-3 rounded-button text-xs font-semibold font-poppins transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
