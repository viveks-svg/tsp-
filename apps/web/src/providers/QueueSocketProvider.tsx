"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { useCallStore } from "@/features/call/store/call.store";
import { getSocketUrl } from "@/features/call/hooks/useCallSocket";

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
  const { user } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Same origin as the site: the httpOnly session cookie authenticates the
    // handshake (no token in page memory, so it survives reloads).
    const newSocket = io(getSocketUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("queue:joined", (data) => {
      if (data.entry?.userId === userId) {
        toast.success("You're in the queue. We'll bring you in when Dr. Pradeep is ready.");
      }
    });

    // Sent only to this person's own connections, with their call credentials.
    newSocket.on("queue:promoted", (data: { campaignId: string; userId: string; consultationId: string; message: string; trtc?: any }) => {
      if (data.userId !== userId) return;
      if (data.trtc) {
        useCallStore.getState().setConnecting({
          channelName: data.trtc.channelName,
          userSig: data.trtc.user.userSig,
          trtcUserId: data.trtc.user.trtcUserId,
          sdkAppId: data.trtc.sdkAppId,
          // What the wallet pays for at the campaign rate (the server caps billing there too).
          maxDurationSeconds: data.trtc.maxDurationSeconds ?? 3600,
        });
      }
      toast.success(data.message || "Your consultation is starting now.", { duration: 8000 });
      router.push(`${ROUTES.CONSULTATIONS}/${data.consultationId}/call`);
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [userId, router]);

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
