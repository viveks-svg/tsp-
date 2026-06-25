"use client";

import React, { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { MessageSquare, Send, PhoneOff, AlertTriangle, Star, CheckCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants/routes";

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

interface Thread {
  id: string;
  status: string;
  messages: Message[];
}

export default function ChatWindowPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Auth & store info
  const { user, walletBalance, accessToken, hydrate } = useAuth();

  // Component states
  const [consultation, setConsultation] = useState<any>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer states
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [initialSeconds, setInitialSeconds] = useState<number>(0);
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(0);

  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Start consultation (if PENDING), then fetch thread
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch list to find this specific consultation
        const consultations = await apiClient.get<any[]>(ENDPOINTS.CONSULTATIONS.LIST);
        const activeCons = consultations.find((c) => c.id === id);

        if (!activeCons) {
          throw new Error("Consultation not found");
        }

        if (activeCons.status === "COMPLETED" || activeCons.status === "CANCELLED") {
          router.push(ROUTES.CONSULTATIONS);
          return;
        }

        // If consultation is still PENDING, start it first.
        // This transitions status → ACTIVE and creates the ChatThread.
        if (activeCons.status === "PENDING") {
          try {
            const startedCons = await apiClient.post<any>(ENDPOINTS.CONSULTATIONS.START(id));
            // Merge the started data back
            Object.assign(activeCons, startedCons);
          } catch (startErr) {
            throw new Error(
              `Failed to start consultation: ${startErr instanceof Error ? startErr.message : "Unknown error"}`
            );
          }
        }

        // Now fetch the thread (guaranteed to exist after start())
        const activeThread = await apiClient.get<Thread>(`/consultations/${id}/thread`);

        if (!cancelled) {
          setConsultation(activeCons);
          setThread(activeThread);
          setMessages(activeThread.messages || []);

          // Calculate allowed duration
          const rate = Number(activeCons.lockedPricingPerMin);
          const balance = user?.role === "ASTROLOGER"
            ? Number(activeCons.user?.wallet?.balance ?? 0)
            : Number(walletBalance);

          if (user?.role !== "ASTROLOGER" && balance < rate) {
            throw new Error("Insufficient wallet balance to continue this chat.");
          }

          const allowedMins = Math.max(1, Math.floor(balance / rate));
          const allowedSecs = allowedMins * 60;

          setSecondsRemaining(allowedSecs);
          setInitialSeconds(allowedSecs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chat details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id, walletBalance, router]);

  // 2. Setup WebSocket Connection — with JWT auth token
  useEffect(() => {
    if (!thread) return;

    // Derive socket server URL from API base URL (remove /api/v1 suffix)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
    const socketUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

    // Connect to NestJS websocket server with auth token
    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      auth: {
        token: accessToken ?? "",
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("connected");
      // Join consultation room
      socket.emit("join_thread", { threadId: thread.id });
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    // Handle auth errors from gateway
    socket.on("auth_error", (data: { message: string }) => {
      console.error("Socket auth error:", data.message);
      setError(`Authentication failed: ${data.message}`);
    });

    // Receive message
    socket.on("chat_message", (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate logs
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Receive end session command
    socket.on("end_session", () => {
      handleSessionFinishedBySystem();
    });

    return () => {
      socket.disconnect();
    };
  }, [thread, accessToken]);

  // 3. Scroll to Bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Timer Countdown & Auto-completion
  useEffect(() => {
    if (loading || error || showReviewModal || secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          void autoEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, secondsRemaining, showReviewModal]);

  // Handle automatic session termination (wallet depleted)
  const autoEndSession = async () => {
    const elapsedSeconds = initialSeconds - 0;
    const elapsedMins = Math.max(1, Math.ceil(elapsedSeconds / 60));
    setSessionDurationMin(elapsedMins);

    try {
      await apiClient.post(ENDPOINTS.CONSULTATIONS.COMPLETE(id), {
        durationMin: elapsedMins,
      });
      // Notify other side
      socketRef.current?.emit("end_session", { threadId: thread?.id });
      // Update local wallet state
      await hydrate();
      setShowReviewModal(true);
    } catch (err) {
      console.error("Auto end session failed:", err);
      setShowReviewModal(true);
    }
  };

  const handleSessionFinishedBySystem = () => {
    setShowReviewModal(true);
  };

  // 5. Send message — senderId is derived from JWT on the gateway
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !thread || !user) return;

    socketRef.current?.emit("chat_message", {
      threadId: thread.id,
      content: inputMessage,
    });

    setInputMessage("");
  };

  // 6. Manual End Session
  const handleEndSessionManual = async () => {
    if (!confirm("Are you sure you want to end this consultation?")) return;

    const elapsedSeconds = initialSeconds - secondsRemaining;
    const elapsedMins = Math.max(1, Math.ceil(elapsedSeconds / 60));
    setSessionDurationMin(elapsedMins);

    try {
      await apiClient.post(ENDPOINTS.CONSULTATIONS.COMPLETE(id), {
        durationMin: elapsedMins,
      });

      socketRef.current?.emit("end_session", { threadId: thread?.id });
      await hydrate();
      setShowReviewModal(true);
    } catch (err) {
      alert("Failed to complete session: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  // 7. Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setReviewSubmitting(true);
      await apiClient.post(`/consultations/${id}/review`, {
        rating,
        review: reviewComment,
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        router.push(ROUTES.CONSULTATIONS);
      }, 1500);
    } catch (err) {
      alert("Failed to submit review. Redirecting you shortly...");
      router.push(ROUTES.CONSULTATIONS);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Format countdown clock
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
        <Loader2 className="w-10 h-10 animate-spin text-navy" />
        <p className="mt-4 text-sm font-semibold text-dark font-poppins">Loading consultation room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-card-lg border border-border p-8 text-center shadow-card max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-dark mb-2">Failed to Join Room</h2>
          <p className="text-sm text-paragraph mb-6">{error}</p>
          <button
            onClick={() => router.push(ROUTES.CONSULTATIONS)}
            className="w-full bg-navy text-white hover:bg-navy-hover py-2.5 rounded-button text-xs font-semibold font-poppins transition-colors"
          >
            Go back to consultations
          </button>
        </div>
      </div>
    );
  }

  const astroName = consultation?.astrologer?.user?.name || "TSP Astrologer";
  const perMinRate = Number(consultation?.lockedPricingPerMin);

  return (
    <div className="h-[calc(100vh-80px)] bg-cream flex items-center justify-center p-0 sm:p-4 md:p-6 font-inter relative overflow-hidden">
      
      <div className="w-full max-w-xl h-full sm:h-[80vh] sm:max-h-[680px] bg-white sm:rounded-2xl sm:shadow-card sm:border sm:border-border flex flex-col justify-between overflow-hidden relative">
        
        {/* Top consultation status bar */}
        <header className="bg-white border-b border-border py-3 px-4 md:px-6 shadow-sm flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-heading font-bold text-sm">
              {astroName.charAt(0)}
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-dark">{astroName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider font-poppins flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Chat
                </span>
                <span className="text-[10px] text-muted">₹{perMinRate}/min</span>
              </div>
            </div>
          </div>

          {/* Live timer display */}
          <div className="flex items-center gap-4">
            <div className="bg-navy/5 border border-navy/15 rounded-lg px-4 py-2 text-center shrink-0 min-w-28">
              <p className="text-[9px] text-muted uppercase font-bold tracking-wider font-poppins">Remaining</p>
              <p className={cn(
                "text-lg font-bold font-poppins",
                secondsRemaining < 60 ? "text-rose-600 animate-pulse" : "text-navy"
              )}>
                {formatTime(secondsRemaining)}
              </p>
            </div>

            <button
              onClick={handleEndSessionManual}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-button text-xs font-bold font-poppins flex items-center gap-1.5 transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              End Consultation
            </button>
          </div>
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 md:px-6 bg-cream/35">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30 mb-2" />
            <p className="text-xs font-poppins">Consultation session started. Say hello to {astroName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isSystem = msg.type === "SYSTEM";

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center py-2">
                  <span className="bg-cream-dark border border-border px-3 py-1 rounded-full text-[10px] text-paragraph font-medium font-poppins">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[75%] md:max-w-[60%] space-y-1.5",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                    isMe
                      ? "bg-navy text-white rounded-tr-none"
                      : "bg-white text-dark border border-border rounded-tl-none"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-muted font-poppins px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </main>

        {/* Message input bar */}
        <footer className="bg-white border-t border-border p-4 md:px-6 shrink-0 z-10">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            placeholder={`Type your message to ${astroName}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={secondsRemaining <= 0 || showReviewModal}
            className="flex-1 px-4 py-3 bg-cream/40 border border-border rounded-xl text-sm focus:outline-none focus:border-gold transition-colors font-poppins disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || secondsRemaining <= 0 || showReviewModal}
            className="bg-navy hover:bg-navy-hover text-white p-3.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* Star Rating & Review Modal Overlay */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card-lg border border-border p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            
            {reviewSubmitted ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-bold text-dark">Thank You for Your Feedback!</h3>
                <p className="text-xs text-paragraph">
                  Your review has been submitted. Redirecting you to your consultations history...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-dark">Consultation Finished</h3>
                  <p className="text-xs text-paragraph mt-1.5">
                    Your {sessionDurationMin} min chat with <span className="font-semibold">{astroName}</span> is complete. Rate your experience below:
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
                          star <= rating ? "fill-gold text-gold" : "text-border"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Feedback Comment */}
                <div className="text-left space-y-1.5">
                  <label htmlFor="comment" className="text-xs font-bold text-dark font-poppins">
                    Review Description (Optional)
                  </label>
                  <textarea
                    id="comment"
                    placeholder="Describe your conversation with Acharya..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-cream/30 border border-border rounded-lg text-xs font-poppins focus:outline-none focus:border-gold transition-all"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full bg-navy hover:bg-navy-hover text-white py-3 rounded-button text-xs font-semibold font-poppins flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      </div>
    </div>
  );
}
