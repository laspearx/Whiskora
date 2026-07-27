import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";

interface EmptySectionProps {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/** Centralizes the .fd-empty-sm pattern that used to be copy-pasted across each dashboard section. */
export default function EmptySection({ text, ctaLabel, ctaHref }: EmptySectionProps) {
  return (
    <div className="fd-empty-sm">
      {text}
      {ctaLabel && ctaHref && (
        <>
          {' '}
          <Link href={ctaHref} style={{ color: F.pink, fontWeight: 700 }}>{ctaLabel}</Link>
        </>
      )}
    </div>
  );
}
