// client/src/pages/RfpDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRfpById,
  sendRfpToVendors,
  getRfpComparison,
  processGmailReplies
} from "../api/rfpApi";
import type { Rfp, ComparisonResult } from "../api/rfpApi";
import { getVendors } from "../api/vendorApi";
import { getProposalsForRfp } from "../api/proposalApi";
import type { Vendor } from "../api/vendorApi";
import type { Proposal } from "../api/proposalApi";

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

export default function RfpDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rfpId = Number(id);

  const [rfp, setRfp] = useState<Rfp | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(rfpId)) {
      setError("Invalid RFP id");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [rfpData, vendorsData, proposalsData] = await Promise.all([
          getRfpById(rfpId),
          getVendors(),
          getProposalsForRfp(rfpId)
        ]);
        setRfp(rfpData);
        setVendors(vendorsData);
        setProposals(proposalsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load RFP detail");
      } finally {
        setLoading(false);
      }
    })();
  }, [rfpId]);

  async function handleSendToVendors() {
    if (!rfp) return;
    if (selectedVendorIds.length === 0) {
      setError("Select at least one vendor to send the RFP to.");
      return;
    }
    setError(null);
    setFlash(null);
    setSendLoading(true);
    try {
      const result = await sendRfpToVendors(rfp.id, selectedVendorIds);
      setRfp(result.rfp); // status may change to SENT
      setFlash(
        `RFP sent to ${
          result.results.filter((r) => r.success).length
        } vendor(s).`
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to send RFP to vendors");
    } finally {
      setSendLoading(false);
    }
  }

  async function handleRefreshProposals() {
    try {
      setError(null);
      setFlash(null);

      // 1️⃣ Process new Gmail replies on the backend
      const processed = await processGmailReplies();
      console.log("Processed Gmail replies:", processed);

      // 2️⃣ Fetch proposals for this RFP
      const data = await getProposalsForRfp(rfpId);
      setProposals(data);

      const ingestedCount = processed.filter(
        (item) => item.status === "ingested"
      ).length;

      setFlash(
        ingestedCount > 0
          ? `Fetched ${ingestedCount} new proposal(s) from Gmail.`
          : "No new Gmail replies. Proposals refreshed."
      );
    } catch (err) {
      console.error(err);
      setError("Failed to refresh proposals / process Gmail replies");
    }
  }

  async function handleRunComparison() {
    if (!rfp) return;
    setComparisonLoading(true);
    setError(null);
    setFlash(null);
    try {
      const result = await getRfpComparison(rfp.id);
      setComparison(result);
      setFlash("Comparison completed.");
      // Also refresh proposals to see updated AI scores
      const updated = await getProposalsForRfp(rfp.id);
      setProposals(updated);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to run AI comparison");
    } finally {
      setComparisonLoading(false);
    }
  }

  function toggleVendorSelection(id: number) {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  if (loading) {
    return React.createElement(
      "div",
      { style: { padding: "1.5rem" } },
      React.createElement("p", null, "Loading RFP...")
    );
  }

  if (error) {
    return React.createElement(
      "div",
      { style: { padding: "1.5rem" } },

      React.createElement(
        "button",
        {
          onClick: () => navigate(-1),
          style: { marginBottom: "1rem" }
        },
        "← Back"
      ),

      React.createElement("p", { style: { color: "red" } }, error)
    );
  }

  if (!rfp) {
    return React.createElement(
      "div",
      { style: { padding: "1.5rem" } },

      React.createElement(
        "button",
        {
          onClick: () => navigate(-1),
          style: { marginBottom: "1rem" }
        },
        "← Back"
      ),

      React.createElement("p", null, "RFP not found.")
    );
  }

  const recommendedVendorId = comparison?.recommendedVendorId ?? null;

  return React.createElement(
    "div",
    {
      style: {
        padding: "1.5rem",
        display: "grid",
        gap: "1.25rem"
      }
    },

    // Back button
    React.createElement(
      "button",
      {
        onClick: () => navigate(-1),
        style: { width: "fit-content" }
      },
      "← Back"
    ),

    // --- RFP Details Section ---
    React.createElement(
      "section",
      {
        style: {
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem"
        }
      },
      React.createElement("h2", { style: { marginTop: 0 } }, rfp.title),

      React.createElement(
        "p",
        { style: { fontSize: 13, color: "#666" } },
        "Created: ",
        formatDate(rfp.createdAt),
        " | Status: ",
        React.createElement("b", null, rfp.status)
      ),

      React.createElement(
        "p",
        { style: { whiteSpace: "pre-wrap", fontSize: 14 } },
        rfp.description
      ),

      React.createElement(
        "div",
        { style: { fontSize: 13, marginTop: "0.5rem" } },
        React.createElement("strong", null, "Budget:"),
        " ",
        rfp.budget ?? "N/A",
        " | ",
        React.createElement("strong", null, "Delivery timeline:"),
        " ",
        rfp.deliveryTimelineDays ?? "N/A",
        " days | ",
        React.createElement("strong", null, "Payment terms:"),
        " ",
        rfp.paymentTerms ?? "N/A",
        " | ",
        React.createElement("strong", null, "Warranty:"),
        " ",
        rfp.warrantyMonths ?? "N/A",
        " months"
      )
    ),

    // --- Send to Vendors Section ---
    React.createElement(
      "section",
      {
        style: {
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem"
        }
      },

      React.createElement("h3", null, "Send RFP to vendors"),

      React.createElement(
        "p",
        { style: { fontSize: 13, color: "#555" } },
        "Select vendors to send this RFP to. Emails are sent via Gmail."
      ),

      vendors.length === 0
        ? React.createElement(
            "p",
            { style: { fontSize: 13, color: "#777" } },
            "No vendors defined yet. Go to the Vendors tab to add some."
          )
        : [
            // Vendor list
            React.createElement(
              "div",
              {
                key: "vendor-list",
                style: {
                  display: "grid",
                  gap: "0.25rem",
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid #eee",
                  padding: "0.5rem",
                  borderRadius: 6
                }
              },
              vendors.map((v) =>
                React.createElement(
                  "label",
                  {
                    key: v.id,
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: 13
                    }
                  },
                  React.createElement("input", {
                    type: "checkbox",
                    checked: selectedVendorIds.includes(v.id),
                    onChange: () => toggleVendorSelection(v.id)
                  }),
                  React.createElement(
                    "span",
                    null,
                    React.createElement("b", null, v.name),
                    " — ",
                    v.email,
                    v.category ? ` (${v.category})` : ""
                  )
                )
              )
            ),

            // Send button
            React.createElement(
              "button",
              {
                key: "send-btn",
                onClick: handleSendToVendors,
                disabled: sendLoading || selectedVendorIds.length === 0,
                style: {
                  marginTop: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: "none",
                  cursor:
                    sendLoading || selectedVendorIds.length === 0
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    sendLoading || selectedVendorIds.length === 0 ? 0.6 : 1
                }
              },
              sendLoading ? "Sending..." : "Send RFP to selected vendors"
            )
          ]
    ),

    // --- Proposals Section ---
    React.createElement(
      "section",
      {
        style: {
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem"
        }
      },

      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem"
          }
        },
        React.createElement("h3", { style: { margin: 0 } }, "Proposals"),
        React.createElement(
          "div",
          { style: { display: "flex", gap: "0.5rem" } },
          React.createElement(
            "button",
            { onClick: handleRefreshProposals },
            "Refresh proposals"
          ),
          React.createElement(
            "button",
            {
              onClick: handleRunComparison,
              disabled: comparisonLoading || proposals.length === 0
            },
            comparisonLoading ? "Running comparison..." : "Run AI comparison"
          )
        )
      ),

      React.createElement(
        "p",
        { style: { fontSize: 13, color: "#555" } },
        "Proposals are parsed from vendor email replies using AI."
      ),

      proposals.length === 0
        ? React.createElement(
            "p",
            { style: { fontSize: 13, color: "#777" } },
            "No proposals yet. Once vendors reply by email and you process Gmail replies, they will appear here."
          )
        : React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13
              }
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Vendor",
                  "Price",
                  "Delivery",
                  "Payment terms",
                  "Warranty",
                  "AI score"
                ].map((label) =>
                  React.createElement(
                    "th",
                    { key: label, style: thStyle },
                    label
                  )
                )
              )
            ),
            React.createElement(
              "tbody",
              null,
              proposals.map((p) =>
                React.createElement(
                  "tr",
                  {
                    key: p.id,
                    style: {
                      background:
                        recommendedVendorId &&
                        p.vendorId === recommendedVendorId
                          ? "#e8f7e8"
                          : "transparent"
                    }
                  },
                  React.createElement("td", { style: tdStyle }, p.vendor.name),
                  React.createElement(
                    "td",
                    { style: tdStyle },
                    p.totalPrice != null ? p.totalPrice : "N/A"
                  ),
                  React.createElement(
                    "td",
                    { style: tdStyle },
                    p.deliveryDays != null ? `${p.deliveryDays} days` : "N/A"
                  ),
                  React.createElement(
                    "td",
                    { style: tdStyle },
                    p.paymentTerms ?? "N/A"
                  ),
                  React.createElement(
                    "td",
                    { style: tdStyle },
                    p.warrantyMonths != null
                      ? `${p.warrantyMonths} months`
                      : "N/A"
                  ),
                  React.createElement(
                    "td",
                    { style: tdStyle },
                    p.aiScore != null ? Math.round(p.aiScore) : "-"
                  )
                )
              )
            )
          )
    ),

    // --- AI Recommendation Section ---
    comparison &&
      React.createElement(
        "section",
        {
          style: {
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "1rem"
          }
        },
        React.createElement("h3", null, "AI Recommendation"),
        React.createElement(
          "p",
          { style: { fontSize: 13, color: "#555" } },
          comparison.rfpSummary
        ),
        React.createElement(
          "p",
          { style: { fontSize: 14 } },
          React.createElement("strong", null, "Recommendation:"),
          " ",
          recommendedVendorId
            ? `Vendor ID ${recommendedVendorId}`
            : "No clear recommendation"
        ),
        React.createElement(
          "p",
          { style: { fontSize: 13, whiteSpace: "pre-wrap" } },
          comparison.reasoning
        )
      ),

    // --- Flash + Errors ---
    (flash || error) &&
      React.createElement(
        "section",
        null,
        flash &&
          React.createElement(
            "p",
            { style: { fontSize: 13, color: "green" } },
            flash
          ),
        error &&
          React.createElement(
            "p",
            { style: { fontSize: 13, color: "red" } },
            error
          )
      )
  );
}

// handy styles
const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "0.4rem"
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #f2f2f2",
  padding: "0.4rem"
};
