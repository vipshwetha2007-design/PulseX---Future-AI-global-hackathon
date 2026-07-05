import { useEffect, useState } from "react";
import { FlaskConical, Download } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { downloadJson } from "../../lib/download";
import { Card, PageHeader, Badge, Button, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";

export default function LabReports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .records()
      .then((r) => setRecords(r.filter((rec) => rec.type === "lab_report")))
      .catch((err) => setError(err.response?.data?.error || "Failed to load lab reports"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div>
      <PageHeader title="Lab Reports" subtitle="Reports uploaded by your laboratory or care team" />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No lab reports yet"
          desc="This build stores report metadata only — file uploads aren't wired to storage yet. Reports added by a lab will appear here."
        />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center shrink-0">
                <FlaskConical size={16} className="text-mist" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-paper">{r.title}</p>
                {r.notes && <p className="text-sm text-mist mt-1">{r.notes}</p>}
                <Badge tone="default">{new Date(r.date).toLocaleDateString()}</Badge>
              </div>
              <Button
                variant="ghost"
                onClick={() => downloadJson(`${r.title.replace(/\s+/g, "-").toLowerCase()}.json`, r)}
              >
                <Download size={14} /> Download
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
