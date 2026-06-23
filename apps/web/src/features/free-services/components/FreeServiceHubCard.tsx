"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { FreeServiceItem } from "@/types/free-services";

interface FreeServiceHubCardProps {
  service: FreeServiceItem;
}

export default function FreeServiceHubCard({ service }: FreeServiceHubCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={service.href}>
        <Card className="rounded-card-lg shadow-card border-border card-hover h-full group">
          <CardContent className="pt-6 pb-6">
            <span className="text-3xl mb-4 block">{service.icon}</span>
            <h3 className="font-heading text-lg font-semibold text-dark mb-2 group-hover:text-navy transition-colors">
              {service.title}
            </h3>
            <p className="text-paragraph text-sm leading-relaxed mb-4">
              {service.description}
            </p>
            <span className="inline-flex items-center gap-1 text-navy font-poppins text-sm font-semibold group-hover:text-gold transition-colors">
              Explore now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
