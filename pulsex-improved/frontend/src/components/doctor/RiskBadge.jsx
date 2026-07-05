import { Badge } from "../ui";

export function riskTone(score) {
  if (score >= 60) return "rejected";
  if (score >= 30) return "pending_review";
  return "approved";
}

export function riskLabel(score) {
  if (score >= 60) return "High risk";
  if (score >= 30) return "Elevated risk";
  return "Low risk";
}

export default function RiskBadge({ score }) {
  if (score === undefined || score === null) return null;
  return (
    <Badge tone={riskTone(score)}>
      {riskLabel(score)} · {score}
    </Badge>
  );
}
