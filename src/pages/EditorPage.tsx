import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
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
import { aiDraftToProcessCanvasBlueprint } from "../processCanvas/processCanvasAI";

type ValidationIssue = { level: "error" | "warning"; message: string };
type CreationMode = "choice" | "description";
type CreationIntent = "new" | "regenerate";

const GENERATE_PROCESS_CANVAS_URL =
  "https://vhjpbucxegiavmmbuker.supabase.co/functions/v1/generate-process-canvas";

const TURNSTILE_SITE_KEY = "0x4AAAAAAE9_pptUbJzlJxLO";
const TURNSTILE_SCRIPT_ID = "process-canvas-turnstile-script";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "auto" | "light" | "dark";
      size?: "normal" | "compact" | "flexible";
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function EditorPage() {
  const location = useLocation();
  const openCreateDialogFromNavigation = Boolean(
    (location.state as { openCreateDialog?: boolean } | null)?.openCreateDialog
  );
  const [blueprint, setBlueprint] = useState<ProcessCanvasBlueprint>(() => makeBlankProcessCanvasBlueprint());
  const [validationOpen, setValidationOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [creationOpen, setCreationOpen] = useState(openCreateDialogFromNavigation);
  const [creationMode, setCreationMode] = useState<CreationMode>("choice");
  const [creationIntent, setCreationIntent] = useState<CreationIntent>("new");
  const [processDescription, setProcessDescription] = useState("");
  const [aiSourceDescription, setAiSourceDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showAIDraftNotice, setShowAIDraftNotice] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!creationOpen || creationMode !== "description") {
      setTurnstileToken("");
      setTurnstileReady(false);

      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;

    const renderWidget = () => {
      if (
        cancelled ||
        !turnstileContainerRef.current ||
        !window.turnstile ||
        turnstileWidgetIdRef.current
      ) {
        return;
      }

      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: TURNSTILE_SITE_KEY,
          action: "generate_process_canvas",
          theme: "light",
          size: "flexible",
          callback: (token) => {
            setTurnstileToken(token);
            setTurnstileReady(true);
            setGenerationError(null);
          },
          "expired-callback": () => {
            setTurnstileToken("");
            setTurnstileReady(false);
          },
          "timeout-callback": () => {
            setTurnstileToken("");
            setTurnstileReady(false);
          },
          "error-callback": () => {
            setTurnstileToken("");
            setTurnstileReady(false);
            setGenerationError(
              "Human verification could not be completed. Please try again."
            );
          },
        }
      );
    };

    const waitForTurnstile = () => {
      if (cancelled) return;
      if (window.turnstile) {
        renderWidget();
        return;
      }
      retryTimer = window.setTimeout(waitForTurnstile, 100);
    };

    const existingScript = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (existingScript) {
      waitForTurnstile();
    } else {
      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = waitForTurnstile;
      script.onerror = () => {
        if (!cancelled) {
          setGenerationError(
            "Human verification could not be loaded. Please check your connection and try again."
          );
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);

      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [creationOpen, creationMode]);

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileReady(false);

    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  const issues = useMemo<ValidationIssue[]>(() => validateProcessCanvasBlueprint(blueprint), [blueprint]);

  function setName(name: string) {
    setBlueprint((prev) => ({ ...deepClonePCB(prev), meta: { ...prev.meta, name } }));
  }

  function openNewCanvasDialog() {
    if (!window.confirm("Start a new Process Canvas? Unsaved changes will be lost after you choose a creation option.")) return;
    setCreationIntent("new");
    setCreationMode("choice");
    setProcessDescription("");
    setGenerationError(null);
    setTurnstileToken("");
    setTurnstileReady(false);
    setCreationOpen(true);
  }

  function openRegenerateDialog() {
    if (!aiSourceDescription || isGenerating) return;

    setCreationIntent("regenerate");
    setCreationMode("description");
    setProcessDescription(aiSourceDescription);
    setGenerationError(null);
    setTurnstileToken("");
    setTurnstileReady(false);
    setCreationOpen(true);
  }

  function closeCreationDialog() {
    if (isGenerating) return;
    setCreationOpen(false);
    setCreationIntent("new");
    setCreationMode("choice");
    setProcessDescription("");
    setGenerationError(null);
    setTurnstileToken("");
    setTurnstileReady(false);
  }

  function createBlankBlueprint() {
    setBlueprint(makeBlankProcessCanvasBlueprint());
    setAiSourceDescription(null);
    setShowAIDraftNotice(false);
    closeCreationDialog();
  }

  async function continueFromDescription() {
    const description = processDescription.trim();
    if (description.length < 10 || !turnstileToken || isGenerating) return;

    setGenerationError(null);
    setIsGenerating(true);

    try {
      const response = await fetch(GENERATE_PROCESS_CANVAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processDescription: description,
          turnstileToken,
        }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The AI service returned an unreadable response.");
      }

      const result = payload as {
        ok?: boolean;
        draft?: unknown;
        error?: string;
        details?: unknown;
      };

      if (!response.ok || result.ok !== true || !result.draft) {
        let message = result.error || "Could not generate the Process Canvas.";

        if (result.details && typeof result.details === "object") {
          const details = result.details as { message?: unknown };
          if (typeof details.message === "string" && details.message.trim()) {
            message += ` ${details.message.trim()}`;
          }
        } else if (typeof result.details === "string" && result.details.trim()) {
          message += ` ${result.details.trim()}`;
        }

        throw new Error(message);
      }

      const generatedBlueprint = aiDraftToProcessCanvasBlueprint(result.draft);
      setBlueprint(generatedBlueprint);
      setAiSourceDescription(description);
      setValidationOpen(false);
      setShowAIDraftNotice(true);
      setCreationOpen(false);
      setCreationIntent("new");
      setCreationMode("choice");
      setProcessDescription("");
      setGenerationError(null);
      setTurnstileToken("");
      setTurnstileReady(false);
    } catch (error) {
      resetTurnstile();
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Could not generate the Process Canvas. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
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
        setAiSourceDescription(null);
        setShowAIDraftNotice(false);
        setShowAIDraftNotice(false);
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
          <button type="button" onClick={openNewCanvasDialog} style={toolbarButton()}>
            New
          </button>

          {aiSourceDescription ? (
            <button
              type="button"
              onClick={openRegenerateDialog}
              style={toolbarButton()}
              title="Review the original description and generate a fresh AI draft"
            >
              Regenerate
            </button>
          ) : null}

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

      {creationOpen ? (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCreationDialog();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-canvas-title"
            style={{
              width: "min(720px, 100%)",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #dbe3ec",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h2 id="new-canvas-title" style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>
                  {creationIntent === "regenerate"
                    ? "Regenerate Process Canvas"
                    : "Create a new Process Canvas"}
                </h2>
                <p style={{ margin: "8px 0 0", color: "#64748b", lineHeight: 1.55 }}>
                  {creationIntent === "regenerate"
                    ? "Review or revise the original description before generating a fresh draft."
                    : "Start with an empty canvas or describe a process and let the application prepare a first draft."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreationDialog}
                aria-label="Close"
                disabled={isGenerating}
                style={closeButtonStyle(isGenerating)}
              >
                ×
              </button>
            </div>

            {creationMode === "choice" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 24 }}>
                <button type="button" onClick={createBlankBlueprint} style={creationCardStyle()}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Blank Canvas</span>
                  <span style={{ color: "#64748b", lineHeight: 1.5 }}>
                    Open an empty Process Canvas and complete the elements yourself.
                  </span>
                </button>

                <button type="button" onClick={() => setCreationMode("description")} style={creationCardStyle()}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Create from Description</span>
                  <span style={{ color: "#64748b", lineHeight: 1.5 }}>
                    Describe the process in your own words and generate an initial Process Canvas draft.
                  </span>
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                {creationIntent === "regenerate" ? (
                  <div
                    style={{
                      marginBottom: 16,
                      border: "1px solid #fed7aa",
                      background: "#fff7ed",
                      color: "#9a3412",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Current canvas will be replaced.</strong> Your existing edits remain unchanged until the new draft is generated successfully.
                  </div>
                ) : null}

                <label htmlFor="process-description" style={{ display: "block", fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                  {creationIntent === "regenerate" ? "Review the process description" : "Describe the process"}
                </label>
                <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 14, lineHeight: 1.55 }}>
                  Explain the process idea or paste an existing textual description. Include whatever you know about its purpose,
                  customers or beneficiaries, main activities, actors, resources, impacts, constraints, or responsibilities.
                  You do not need to structure the text, and you can leave genuinely unknown aspects out.
                </p>
                <textarea
                  id="process-description"
                  autoFocus
                  value={processDescription}
                  onChange={(e) => {
                    setProcessDescription(e.target.value);
                    if (generationError) setGenerationError(null);
                  }}
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                  placeholder="For example: Customers apply online for a personal loan. The bank verifies identity and creditworthiness, makes a lending decision..."
                  rows={10}
                  maxLength={12000}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    resize: "vertical",
                    minHeight: 190,
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 12,
                    outline: "none",
                    font: "inherit",
                    lineHeight: 1.55,
                    color: "#0f172a",
                    background: isGenerating ? "#f8fafc" : "#fff",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginTop: 6,
                    color: "#64748b",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  <span>More concrete context generally produces a better first draft.</span>
                  <span>{processDescription.length.toLocaleString()} / 12,000</span>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 0 2px",
                    minHeight: 66,
                  }}
                >
                  <div
                    ref={turnstileContainerRef}
                    aria-label="Human verification"
                  />
                  {!turnstileReady && !generationError ? (
                    <div
                      style={{
                        marginTop: 6,
                        color: "#64748b",
                        fontSize: 12,
                        lineHeight: 1.4,
                      }}
                    >
                      Completing human verification…
                    </div>
                  ) : null}
                </div>

                {generationError ? (
                  <div
                    role="alert"
                    style={{
                      marginTop: 12,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#991b1b",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {generationError}
                  </div>
                ) : null}

                {isGenerating ? (
                  <div
                    style={{
                      marginTop: 12,
                      color: "#475569",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    Generating the Process Canvas draft. This may take a few seconds.
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isGenerating) return;
                      setGenerationError(null);
                      if (creationIntent === "regenerate") {
                        closeCreationDialog();
                      } else {
                        setCreationMode("choice");
                      }
                    }}
                    disabled={isGenerating}
                    style={toolbarButton(false, isGenerating)}
                  >
                    {creationIntent === "regenerate" ? "Cancel" : "Back"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void continueFromDescription()}
                    disabled={
                      processDescription.trim().length < 10 ||
                      !turnstileToken ||
                      isGenerating
                    }
                    style={primaryActionButtonStyle(
                      processDescription.trim().length < 10 ||
                        !turnstileToken ||
                        isGenerating
                    )}
                  >
                    {isGenerating
                      ? "Generating draft…"
                      : creationIntent === "regenerate"
                        ? "Regenerate & Replace Canvas"
                        : "Create Draft"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

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
        {showAIDraftNotice ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "start",
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1e3a5f",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>AI-generated draft.</strong> Review and refine the suggested elements. Empty fields indicate information that could not be reliably derived from the description.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {aiSourceDescription ? (
                <button
                  type="button"
                  onClick={openRegenerateDialog}
                  style={{
                    border: "1px solid #93c5fd",
                    background: "#ffffff",
                    color: "#1d4ed8",
                    borderRadius: 8,
                    padding: "6px 9px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  Regenerate from description
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShowAIDraftNotice(false)}
                aria-label="Dismiss AI draft notice"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#1e3a5f",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

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

function toolbarButton(primary = false, disabled = false): CSSProperties {
  return {
    border: primary ? "1px solid #0d4678" : "1px solid #cbd5e1",
    background: disabled ? "#f1f5f9" : primary ? "#0d4678" : "#fff",
    color: disabled ? "#94a3b8" : primary ? "#fff" : "#334155",
    borderRadius: 10,
    padding: "9px 12px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
  };
}

function creationCardStyle(): CSSProperties {
  return {
    display: "grid",
    gap: 8,
    textAlign: "left",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: 18,
    background: "#ffffff",
    cursor: "pointer",
    font: "inherit",
  };
}

function closeButtonStyle(disabled = false): CSSProperties {
  return {
    border: "none",
    background: "transparent",
    color: disabled ? "#cbd5e1" : "#64748b",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 28,
    lineHeight: 1,
    padding: "0 2px",
  };
}

function primaryActionButtonStyle(disabled = false): CSSProperties {
  return {
    border: "1px solid #0d4678",
    background: disabled ? "#94a3b8" : "#0d4678",
    color: "#fff",
    borderRadius: 10,
    padding: "9px 16px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 800,
    opacity: disabled ? 0.72 : 1,
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