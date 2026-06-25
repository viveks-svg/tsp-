import type { Metadata } from "next";
import AstrologersPageContent from "@/features/astrologers/components/AstrologersPageContent";

export const metadata: Metadata = {
  title: "Call with an Astrologer | TSP",
  description:
    "Connect via live audio/video call with verified Vedic experts for personalised guidance on love, career, health, and life's crossroads.",
};

export default function ConsultationCallPage() {
  return <AstrologersPageContent mode="call" />;
}
