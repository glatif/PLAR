import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { VerificationFlow } from "@/components/verification/verification-flow";
import { labEnabled } from "@/lib/verification/storage";

export const metadata: Metadata = { title: "Verify your identity" };

// Edge-to-edge on phones, so the camera fills the screen around the notch and home indicator.
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#0b0b0d" };

/** Identity verification demo: face photo, head movement, ID front and back. Lab only for now. */
export default function VerifyPage() {
  if (!labEnabled()) notFound();
  return <VerificationFlow />;
}
