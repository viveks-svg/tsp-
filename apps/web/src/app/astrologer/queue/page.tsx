import { PageHeader } from "@/features/admin/components/primitives";
import { LiveQueueBoard } from "@/features/queue/components/LiveQueueBoard";

export default function AstrologerQueuePage() {
  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Today"
        title="Live queue"
        description="Clients waiting to speak with you. Call the next client when you are ready — ending a call and calling the next is one step."
      />
      <LiveQueueBoard mode="astrologer" />
    </div>
  );
}
