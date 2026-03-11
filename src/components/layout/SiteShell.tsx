import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type SiteShellProps = {
  children: ReactNode;
  maxWidth?: number;
  contentStyle?: CSSProperties;
};

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const LOGO_SRC = `${BASE_URL}images/PClogo.png`;

const CONTACTS = [
  {
    name: "Prof. Dr. Michael Rosemann",
    role: "Director of Centre for Future Enterprise",
    org1: "Queensland University of Technology",
    org2: "",
    email: "m.rosemann@qut.edu.au",
  },
  {
    name: "Prof. Dr. Oktay Turetken",
    role: "Information Systems Group",
    org1: "Eindhoven University of Technology",
    org2: "",
    email: "o.turetken@tue.nl",
  },
  {
    name: "Prof. Dr. Christoph Buck",
    role: "University of Applied Sciences Augsburg",
    org1: "Queensland University of Technology, CFE",
    org2: "",
    email: "christoph.buck@fim-rc.de",
  },
];

function navLinkStyle(active = false): CSSProperties {
  return {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    color: active ? "#0d4678" : "#334155",
    font: "inherit",
    fontWeight: active ? 800 : 600,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };
}

function actionButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 600,
    background: "#ffffff",
    whiteSpace: "nowrap",
  };
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === "/";

  function goToSection(sectionId: string) {
    if (isLanding) {
      scrollToSection(sectionId);
      return;
    }
    navigate(`/?section=${sectionId}`);
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <img
              src={LOGO_SRC}
              alt="Process Canvas"
              style={{ height: 42, width: "auto", display: "block", objectFit: "contain" }}
            />
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <button type="button" onClick={() => goToSection("what")} style={navLinkStyle(isLanding)}>
              What is it
            </button>
            <button type="button" onClick={() => goToSection("how")} style={navLinkStyle(isLanding)}>
              How it works
            </button>
            <button type="button" onClick={() => goToSection("use-cases")} style={navLinkStyle(isLanding)}>
              Use Cases
            </button>
            <button type="button" onClick={() => goToSection("examples")} style={navLinkStyle(isLanding)}>
              Examples
            </button>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {location.pathname !== "/editor" ? (
            <Link to="/editor" style={{ ...actionButtonStyle(), background: "#0d4678", color: "#fff", borderColor: "#0d4678" }}>
              Open editor
            </Link>
          ) : (
            <Link to="/" style={actionButtonStyle()}>
              Home
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: 156,
        borderTop: "1px solid #dbe3ec",
        background: "#f8fafc",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 20px 22px" }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: "#1e293b", marginBottom: 6 }}>
          Process Canvas ©2025
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {CONTACTS.map((c) => (
            <div
              key={c.email}
              style={{
                background: "#ffffff",
                border: "1px solid #dbe3ec",
                borderRadius: 12,
                padding: "12px 12px 12px",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{c.name}</div>
              <div style={{ color: "#334155", fontSize: 13 }}>{c.role}</div>
              <div style={{ color: "#334155", fontSize: 13 }}>{c.org1}</div>
              {c.org2 ? <div style={{ color: "#334155", fontSize: 13 }}>{c.org2}</div> : null}
              <div style={{ marginTop: 2 }}>
                <a href={`mailto:${c.email}`} style={{ color: "#0d4678", fontWeight: 400, fontSize: 13 }}>
                  {c.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function useLandingSectionRouting() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (!section) return;

    const timer = window.setTimeout(() => {
      scrollToSection(section);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);
}

export default function SiteShell({ children, maxWidth = 1200, contentStyle }: SiteShellProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#0f172a" }}>
      <SiteHeader />
      <main
        style={{
          maxWidth,
          margin: "0 auto",
          padding: "32px 24px 0",
          ...contentStyle,
        }}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}