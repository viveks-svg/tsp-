"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { useCallStore } from "@/features/call/store/call.store";

interface QueueSocketContextValue {
  socket: Socket | null;
  joinQueueRoom: (campaignId: string) => void;
  leaveQueueRoom: (campaignId: string) => void;
}

const QueueSocketContext = createContext<QueueSocketContextValue>({
  socket: null,
  joinQueueRoom: () => {},
  leaveQueueRoom: () => {},
});

export const useQueueSocket = () => useContext(QueueSocketContext);

export function QueueSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user || !accessToken) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[QueueSocket] Connected:", newSocket.id);
    });

    newSocket.on("queue:joined", (data) => {
      // If we joined, we can show a toast
      if (data.entry?.userId === user.id) {
        toast.success("Successfully joined the queue!");
      }
    });

    newSocket.on("queue:calling", (data: { campaignId: string, userId: string, consultationId: string, message: string }) => {
      if (data.userId === user.id) {
        toast.success(data.message || "Dr. Pradeep is ready for your consultation!", {
          duration: 10000,
          action: {
            label: "Go to Consultations",
            onClick: () => {
              router.push(`${ROUTES.CONSULTATIONS}`);
            },
          },
        });
      }
    });

    newSocket.on("queue:promoted", (data: { campaignId: string, userId: string, consultationId: string, message: string, trtc?: any }) => {
      if (data.userId === user.id) {
        // Pre-fill the call store with the TRTC credentials before navigating
        if (data.trtc) {
          useCallStore.getState().setConnecting({
            channelName: data.trtc.channelName,
            userSig: data.trtc.user.userSig,
            trtcUserId: data.trtc.user.trtcUserId,
            sdkAppId: data.trtc.sdkAppId,
            maxDurationSeconds: 3600,
          });
        }
        
        toast.success(data.message || "Your consultation is starting now.", {
          duration: 10000,
          action: {
            label: "Join Call Room",
            onClick: () => {
              router.push(`${ROUTES.CONSULTATIONS}/${data.consultationId}/call`);
            },
          },
        });
        
        // Auto-navigate after 2 seconds if user doesn't click
        setTimeout(() => {
          router.push(`${ROUTES.CONSULTATIONS}/${data.consultationId}/call`);
        }, 2000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, accessToken, router]);

  const joinQueueRoom = (campaignId: string) => {
    if (socket) {
      socket.emit("queue:join_room", { campaignId });
    }
  };

  const leaveQueueRoom = (campaignId: string) => {
    if (socket) {
      socket.emit("queue:leave_room", { campaignId });
    }
  };

  return (
    <QueueSocketContext.Provider value={{ socket, joinQueueRoom, leaveQueueRoom }}>
      {children}
    </QueueSocketContext.Provider>
  );
}
