import type { Metadata } from "next";
import AstrologersPageContent from "@/features/astrologers/components/AstrologersPageContent";
import { chatMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = chatMetadata;

export default function ConsultationChatPage() {
  return <AstrologersPageContent mode="chat" />;
}
