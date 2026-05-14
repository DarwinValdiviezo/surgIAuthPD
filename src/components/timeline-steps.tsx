import { ProcessingSteps } from "@/components/processing-steps";

export function TimelineSteps({ active }: { active: boolean }) {
  return <ProcessingSteps active={active} />;
}
