// client/src/components/RfpCreator.tsx
import React, { useEffect, useState } from "react";
import { createRfpFromText, getAllRfps } from "../api/rfpApi";
import type { Rfp } from "../api/rfpApi";
import { useNavigate } from "react-router-dom";

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

export default function RfpCreator() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [rfps, setRfps] = useState<Rfp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing RFPs on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllRfps();
        setRfps(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load existing RFPs");
      }
    })();
  }, []);

  async function handleCreateRfp() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const newRfp = await createRfpFromText(description.trim());
      setRfps((prev) => [newRfp, ...prev]);
      setDescription("");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to create RFP");
    } finally {
      setLoading(false);
    }
  }

  return React.createElement(
    "div",
    { style: { display: "grid", gap: "1rem", maxWidth: 900 } },
    React.createElement(
      "section",
      { style: { padding: "1rem", border: "1px solid #ddd", borderRadius: 8 } },
      React.createElement("h2", null, "Create RFP from natural language"),
      React.createElement(
        "p",
        { style: { fontSize: 14, color: "#555" } },
        "Describe what you want to procure. The system will use AI to structure it."
      ),
      React.createElement("textarea", {
        rows: 6,
        style: { width: "100%", padding: "0.5rem", fontFamily: "inherit" },
        placeholder:
          "Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.",
        value: description,
        onChange: (e) => setDescription(e.target.value)
      }),
      React.createElement(
        "button",
        {
          onClick: handleCreateRfp,
          disabled: loading || !description.trim(),
          style: {
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            cursor: loading || !description.trim() ? "not-allowed" : "pointer",
            opacity: loading || !description.trim() ? 0.6 : 1
          }
        },
        loading ? "Creating..." : "Create RFP"
      ),
      error &&
        React.createElement(
          "p",
          { style: { color: "red", marginTop: "0.5rem" } },
          error
        )
    ),

    // Existing RFPs section
    React.createElement(
      "section",
      null,
      React.createElement("h2", null, "Existing RFPs"),

      rfps.length === 0
        ? React.createElement(
            "p",
            { style: { fontSize: 14, color: "#777" } },
            "No RFPs yet. Create one above."
          )
        : React.createElement(
            "ul",
            {
              style: {
                listStyle: "none",
                padding: 0,
                display: "grid",
                gap: "0.75rem"
              }
            },
            // ▼▼ INSERTED UPDATED VERSION HERE ▼▼
            rfps.map((rfp) =>
              React.createElement(
                "li",
                {
                  key: rfp.id,
                  style: {
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: "0.75rem 1rem"
                  }
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      alignItems: "center"
                    }
                  },
                  React.createElement(
                    "div",
                    { style: { flex: 1 } },

                    // Title + date
                    React.createElement(
                      "div",
                      {
                        style: {
                          display: "flex",
                          justifyContent: "space-between"
                        }
                      },
                      React.createElement("strong", null, rfp.title),
                      React.createElement(
                        "span",
                        { style: { fontSize: 12, color: "#666" } },
                        formatDate(rfp.createdAt)
                      )
                    ),

                    // Status
                    React.createElement(
                      "div",
                      { style: { fontSize: 13, color: "#444", marginTop: 4 } },
                      "Status: ",
                      React.createElement("b", null, rfp.status)
                    ),

                    // Budget / delivery / warranty
                    React.createElement(
                      "div",
                      { style: { fontSize: 13, color: "#555", marginTop: 4 } },
                      "Budget: ",
                      rfp.budget ?? "N/A",
                      " | Delivery: ",
                      rfp.deliveryTimelineDays ?? "N/A",
                      " days | Warranty: ",
                      rfp.warrantyMonths ?? "N/A",
                      " months"
                    )
                  ),

                  // View button
                  React.createElement(
                    "button",
                    {
                      onClick: () => navigate(`/rfps/${rfp.id}`),
                      style: {
                        padding: "0.35rem 0.7rem",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid #333",
                        background: "#fff",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }
                    },
                    "View"
                  )
                )
              )
            )
            // ▲▲ END INSERTION ▲▲
          )
    )
  );
}
