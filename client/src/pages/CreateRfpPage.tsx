// src/pages/CreateRfpPage.tsx
import { useState } from "react";
import { createRfpFromText, type Rfp } from "../api/rfpApi";

function formatMoney(value: number | null) {
  if (value == null) return "Not specified";
  return value.toLocaleString();
}

export default function CreateRfpPage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfp, setRfp] = useState<Rfp | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    setRfp(null);

    try {
      const created = await createRfpFromText(description.trim());
      setRfp(created);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to create RFP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1>AI-Powered RFP Creator</h1>
      <p style={{ marginBottom: "1rem" }}>
        Describe what you want to procure in natural language. The system will
        turn it into a structured RFP.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="E.g. I need to procure laptops and monitors for our new office..."
          rows={8}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
        />

        <button
          type="submit"
          disabled={loading || !description.trim()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Creating RFP..." : "Create RFP"}
        </button>
      </form>

      {error && <div style={{ marginTop: "1rem", color: "red" }}>{error}</div>}

      {rfp && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "8px"
          }}
        >
          <h2>Structured RFP</h2>
          <p>
            <strong>Title:</strong> {rfp.title}
          </p>
          <p>
            <strong>Status:</strong> {rfp.status}
          </p>
          <p>
            <strong>Budget:</strong> {formatMoney(rfp.budget)}
          </p>
          <p>
            <strong>Delivery timeline:</strong>{" "}
            {rfp.deliveryTimelineDays ?? "Not specified"} days
          </p>
          <p>
            <strong>Payment terms:</strong>{" "}
            {rfp.paymentTerms ?? "Not specified"}
          </p>
          <p>
            <strong>Warranty:</strong> {rfp.warrantyMonths ?? "Not specified"}{" "}
            months
          </p>
          <div style={{ marginTop: "1rem" }}>
            <strong>Original description:</strong>
            <pre
              style={{
                background: "#f7f7f7",
                padding: "0.75rem",
                whiteSpace: "pre-wrap"
              }}
            >
              {rfp.description}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
