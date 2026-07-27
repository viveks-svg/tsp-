import CallRoom from "@/features/call/components/CallRoom";

export default async function AdminCallRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CallRoom consultationId={resolvedParams.id} />;
}
