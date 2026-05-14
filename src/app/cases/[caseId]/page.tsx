import { notFound } from "next/navigation";
import { CaseDetailClient } from "@/components/case-detail-client";
import { findCaseById, findPolicyById } from "@/lib/case-service";

type CaseDetailPageProps = {
  params: Promise<{ caseId: string }>;
};

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    notFound();
  }

  const policy = await findPolicyById(surgicalCase.policyId);

  return <CaseDetailClient initialCase={surgicalCase} initialPolicy={policy} />;
}
