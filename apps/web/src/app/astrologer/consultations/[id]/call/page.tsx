"use client";

import { use } from "react";
import CallRoom from "@/features/call/components/CallRoom";

export default function CallRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <CallRoom consultationId={id} />;
}
