import { redirect } from "next/navigation";

type LegacyCaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function LegacyCaseDetailPage({ params }: LegacyCaseDetailPageProps) {
  const { caseId } = await params;
  redirect(`/cases/${caseId}`);
}
