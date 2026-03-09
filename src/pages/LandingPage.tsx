import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 56 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>ProcessCanvas</div>
        <nav style={{ display: "flex", gap: 16 }}>
          <a href="#what" style={{ color: "#1f2937", textDecoration: "none" }}>What is it</a>
          <a href="#how" style={{ color: "#1f2937", textDecoration: "none" }}>How it works</a>
          <Link to="/editor" style={{ color: "#1f2937", textDecoration: "none", fontWeight: 700 }}>
            Open editor
          </Link>
        </nav>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.2, color: "#6b7280", marginBottom: 8 }}>
            MVP landing page
          </div>
          <h1 style={{ fontSize: 48, lineHeight: 1.08, margin: "0 0 16px 0" }}>
            Design process blueprints in one integrated canvas
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#4b5563", marginBottom: 24 }}>
            This first version focuses on editing, importing, and exporting Process Canvas Blueprints.
            Landing-page content can be refined later.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              to="/editor"
              style={{
                padding: "12px 18px",
                background: "#0d4678",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Start designing
            </Link>
            <a
              href="#what"
              style={{
                padding: "12px 18px",
                border: "1px solid #cbd5e1",
                color: "#111827",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Learn more
            </a>
          </div>
        </div>

        <div
          style={{
            minHeight: 320,
            border: "1px solid #d1d5db",
            borderRadius: 20,
            background: "linear-gradient(135deg, #f8fafc, #e5eef6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontWeight: 700,
          }}
        >
          Process Canvas preview area
        </div>
      </section>

      <section id="what" style={{ marginTop: 72 }}>
        <h2>What is it</h2>
        <p style={{ lineHeight: 1.7, color: "#4b5563" }}>
          The Process Canvas helps structure process design across desirability, feasibility, viability,
          and responsibility in one blueprint.
        </p>
      </section>

      <section id="how" style={{ marginTop: 40 }}>
        <h2>How it works</h2>
        <p style={{ lineHeight: 1.7, color: "#4b5563" }}>
          In this MVP, you can create a blueprint, edit it in the canvas, and export it to JSON, PNG, or PDF.
        </p>
      </section>
    </main>
  );
}