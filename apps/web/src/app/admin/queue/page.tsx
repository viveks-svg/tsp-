import { PageHeader } from "@/features/admin/components/primitives";
import { LiveQueueBoard } from "@/features/queue/components/LiveQueueBoard";

export default function AdminQueuePage() {
  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Dr. Pradeep"
        title="Live queue"
        description="Who is waiting for Dr. Pradeep. He calls clients from his own panel; here you can skip a no-show, remove someone, or close a stuck call."
      />
      <LiveQueueBoard mode="admin" />
    </div>
  );
}
