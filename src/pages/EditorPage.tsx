import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useMemo, useRef, useState } from "react";
import ProcessCanvas from "../components/process-canvas/ProcessCanvas";
import {
  deepClonePCB,
  makeBlankProcessCanvasBlueprint,
  type ProcessCanvasBlueprint,
  validateProcessCanvasBlueprint,
} from "../processCanvas/processCanvasDomain";

function downloadTextFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EditorPage() {
  const [blueprint, setBlueprint] = useState<ProcessCanvasBlueprint>(makeBlankProcessCanvasBlueprint());
  const [busy, setBusy] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const issues = useMemo(() => validateProcessCanvasBlueprint(blueprint), [blueprint]);

  async function exportPng() {
    const node = document.getElementById("process-canvas-export-root");
    if (!node) return;

    setBusy(true);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${blueprint.meta.name || "process-canvas"}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    const node = document.getElementById("process-canvas-export-root");
    if (!node) return;

    setBusy(true);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const img = new Image();
      img.src = dataUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });

      const pdf = new jsPDF({
        orientation: img.width >= img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${blueprint.meta.name || "process-canvas"}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    downloadTextFile(
      `${blueprint.meta.name || "process-canvas"}.json`,
      JSON.stringify(blueprint, null, 2),
      "application/json"
    );
  }

  function importJsonFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as ProcessCanvasBlueprint;
        setBlueprint(parsed);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <main style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Blueprint name</div>
          <input
            value={blueprint.meta.name}
            onChange={(e) =>
              setBlueprint((prev) => ({
                ...deepClonePCB(prev),
                meta: {
                  ...prev.meta,
                  name: e.target.value,
                  updatedAt: new Date().toISOString(),
                },
              }))
            }
            style={{
              fontSize: 20,
              fontWeight: 700,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              minWidth: 320,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setBlueprint(makeBlankProcessCanvasBlueprint())} disabled={busy}>
            New
          </button>
          <button type="button" onClick={exportJson} disabled={busy}>
            Export JSON
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            Import JSON
          </button>
          <button type="button" onClick={exportPng} disabled={busy}>
            Export PNG
          </button>
          <button type="button" onClick={exportPdf} disabled={busy}>
            Export PDF
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importJsonFile(file);
          e.currentTarget.value = "";
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>
        <div ref={exportRef}>
          <ProcessCanvas blueprint={blueprint} onChange={setBlueprint} />
        </div>

        <aside
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 14,
            padding: 14,
            background: "#fff",
            position: "sticky",
            top: 16,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Validation</div>
          {issues.length === 0 ? (
            <div style={{ color: "#065f46" }}>No issues detected.</div>
          ) : (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {issues.map((issue, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <strong>{issue.level}:</strong> {issue.message}
                </li>
              ))}
            </ul>
          )}

          <hr style={{ margin: "14px 0" }} />

          <div style={{ fontWeight: 800, marginBottom: 8 }}>Notes</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#4b5563" }}>
            This MVP focuses on layout fidelity, canvas editing, and file import/export. Routing and landing/editor
            separation are already in place.
          </div>
        </aside>
      </div>
    </main>
  );
}