// client/src/App.tsx
import { Link, Route, Routes, useLocation } from "react-router-dom";
import RfpCreator from "./components/RfpCreator";
import VendorsPage from "./components/VendorsPage";
import RfpDetailPage from "./pages/RfpDetailPage";

function App() {
  const location = useLocation();
  const path = location.pathname;

  const isRfps = path.startsWith("/rfps") || path === "/";
  const isVendors = path.startsWith("/vendors");

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>AI-Powered RFP Management</h1>
        <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
          Create RFPs, manage vendors, send requests, ingest email replies, and
          compare proposals with AI.
        </p>

        <nav
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.5rem"
          }}
        >
          <NavButton to="/rfps" active={isRfps}>
            RFPs
          </NavButton>
          <NavButton to="/vendors" active={isVendors}>
            Vendors
          </NavButton>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<RfpCreator />} />
        <Route path="/rfps" element={<RfpCreator />} />
        <Route path="/rfps/:id" element={<RfpDetailPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
      </Routes>
    </div>
  );
}

type NavButtonProps = {
  to: string;
  active: boolean;
  children: React.ReactNode;
};

function NavButton({ to, active, children }: NavButtonProps) {
  return (
    <Link
      to={to}
      style={{
        padding: "0.4rem 0.9rem",
        borderRadius: 999,
        border: active ? "2px solid #333" : "1px solid #ccc",
        background: active ? "#333" : "#f8f8f8",
        color: active ? "#fff" : "#333",
        textDecoration: "none",
        fontSize: 14
      }}
    >
      {children}
    </Link>
  );
}

export default App;
