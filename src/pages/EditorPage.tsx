import { useMemo, useRef, useState, type CSSProperties } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import ProcessCanvas from "../components/process-canvas/ProcessCanvas";
import SiteShell from "../components/layout/SiteShell";
import {
  deepClonePCB,
  makeBlankProcessCanvasBlueprint,
  type ProcessCanvasBlueprint,
  validateProcessCanvasBlueprint,
} from "../processCanvas/processCanvasDomain";

type ValidationIssue = { level: "error" | "warning"; message: string };

export default function EditorPage() {
  const [blueprint, setBlueprint] = useState<ProcessCanvasBlueprint>(() => makeBlankProcessCanvasBlueprint());
  const [validationOpen, setValidationOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const issues = useMemo<ValidationIssue[]>(() => validateProcessCanvasBlueprint(blueprint), [blueprint]);

  function setName(name: string) {
    setBlueprint((prev) => ({ ...deepClonePCB(prev), meta: { ...prev.meta, name } }));
  }

  function newBlueprint() {
    if (!window.confirm("Create a new blank Process Canvas Blueprint? Unsaved changes will be lost.")) return;
    setBlueprint(makeBlankProcessCanvasBlueprint());
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFileName(blueprint.meta.name || "process-canvas")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPng() {
    if (!exportRef.current) return;
    setMenuOpen(false);
    setIsExporting(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${safeFileName(blueprint.meta.name || "process-canvas")}.png`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  }

  async function exportPdf() {
    if (!exportRef.current) return;
    setMenuOpen(false);
    setIsExporting(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2 });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
      const renderWidth = img.width * ratio;
      const renderHeight = img.height * ratio;
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;
      pdf.addImage(dataUrl, "PNG", x, y, renderWidth, renderHeight);
      pdf.save(`${safeFileName(blueprint.meta.name || "process-canvas")}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  function importJsonFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "{}")) as ProcessCanvasBlueprint;
        setBlueprint(parsed);
      } catch {
        window.alert("Could not read the JSON file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <SiteShell maxWidth={1200} contentStyle={{ paddingTop: 18 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Process Canvas Editor</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={newBlueprint} style={toolbarButton()}>
            New
          </button>

          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} style={toolbarButton(true)}>
              Export/Import ▾
            </button>

            {menuOpen ? (
              <div
                data-export-exclude="true"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: 190,
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                  padding: 6,
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void exportPng();
                  }}
                  style={menuItemButton()}
                >
                  Export PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void exportPdf();
                  }}
                  style={menuItemButton()}
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    exportJson();
                  }}
                  style={menuItemButton()}
                >
                  Export JSON
                </button>
                <div style={{ height: 1, background: "#eee", margin: "6px 0" }} />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  style={menuItemButton()}
                >
                  Import JSON
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

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

      <div style={{ display: "grid", gap: 10 }}>
        <section style={{ border: "1px solid #d7dde5", borderRadius: 10, background: "#f8fafc", overflow: "hidden" }}>
          {validationOpen ? (
            <div>
              <button
                type="button"
                onClick={() => setValidationOpen(false)}
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #d7dde5",
                  background: "#eef4f8",
                  color: "#334155",
                  cursor: "pointer",
                  padding: "8px 12px",
                  fontSize: 12,
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                Validation ▲ {issues.length > 0 ? `(${issues.length})` : ""}
              </button>
              <div style={{ padding: "10px 12px" }}>
                {issues.length === 0 ? (
                  <div style={{ color: "#065f46", fontSize: 14 }}>No issues detected.</div>
                ) : (
                  <ul style={{ paddingLeft: 18, margin: 0, color: "#334155", fontSize: 13, lineHeight: 1.4 }}>
                    {issues.map((issue, i) => (
                      <li key={i} style={{ marginBottom: 5 }}>
                        <strong>{issue.level}:</strong> {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setValidationOpen(true)}
              style={{
                width: "100%",
                border: "none",
                background: "#f8fafc",
                color: "#475569",
                cursor: "pointer",
                padding: "8px 12px",
                fontSize: 12,
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              Validation ▼ {issues.length > 0 ? `(${issues.length})` : ""}
            </button>
          )}
        </section>

        <div ref={exportRef} style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #d7dde5",
              borderRadius: 12,
              padding: "6px 10px",
            }}
          >
            <input
              value={blueprint.meta.name ?? ""}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled Blueprint"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 20,
                fontWeight: 800,
                color: "#0f172a",
                padding: 0,
                margin: 0,
                fontFamily: "inherit",
              }}
            />
          </div>

          <ProcessCanvas blueprint={blueprint} onChange={setBlueprint} showHelpPanel={!isExporting} />
        </div>
      </div>
    </SiteShell>
  );
}

function toolbarButton(primary = false): CSSProperties {
  return {
    border: primary ? "1px solid #0d4678" : "1px solid #cbd5e1",
    background: primary ? "#0d4678" : "#fff",
    color: primary ? "#fff" : "#334155",
    borderRadius: 10,
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: 700,
  };
}

function menuItemButton(): CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    color: "#334155",
    borderRadius: 8,
    padding: "9px 10px",
    cursor: "pointer",
    fontWeight: 700,
  };
}

function safeFileName(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "process-canvas";
}