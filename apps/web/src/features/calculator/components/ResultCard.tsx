import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ResultCard({ title, children }: ResultCardProps) {
  return (
    <Card className="rounded-card-lg shadow-card border-border-premium border">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold text-dark">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-paragraph text-sm leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}
