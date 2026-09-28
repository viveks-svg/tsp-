import { PageHeader } from "@/features/admin/components/primitives";
import { ConsultationList } from "@/features/astrologer/ConsultationList";

export default function AstrologerConsultationsPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Clients"
        title="Consultations"
        description="Your chat and call consultations. Answer a waiting client or rejoin one in progress."
      />
      <ConsultationList withFilters />
    </div>
  );
}
