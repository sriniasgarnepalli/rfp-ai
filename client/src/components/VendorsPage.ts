// client/src/components/VendorsPage.tsx
import React, { useEffect, useState } from "react";
import { getVendors, createVendor, deleteVendor } from "../api/vendorApi";

import type { Vendor } from "../api/vendorApi";

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vendors on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getVendors();
        setVendors(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load vendors");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  async function handleCreateVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newVendor = await createVendor({
        name: name.trim(),
        email: email.trim(),
        category: category.trim() || undefined
      });
      setVendors((prev) => [newVendor, ...prev]);
      setName("");
      setEmail("");
      setCategory("");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Failed to create vendor. Check email format."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteVendor(id: number) {
    if (!window.confirm("Delete this vendor?")) return;

    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete vendor");
    }
  }
  return React.createElement(
    "div",
    { style: { display: "grid", gap: "1.25rem", maxWidth: 900 } },
    // ---- Section: Add Vendor ----
    React.createElement(
      "section",
      {
        style: {
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8
        }
      },
      React.createElement("h2", { style: { marginTop: 0 } }, "Add vendor"),
      React.createElement(
        "p",
        { style: { fontSize: 14, color: "#555" } },
        "Vendors represent suppliers you can send RFPs to."
      ),
      React.createElement(
        "form",
        {
          onSubmit: handleCreateVendor,
          style: { display: "grid", gap: "0.5rem", maxWidth: 500 }
        },
        // Name field
        React.createElement(
          "div",
          null,
          React.createElement(
            "label",
            { style: { fontSize: 13 } },
            "Name",
            React.createElement("br"),
            React.createElement("input", {
              type: "text",
              value: name,
              onChange: (e) => setName(e.target.value),
              style: { width: "100%", padding: "0.4rem" },
              required: true
            })
          )
        ),
        // Email field
        React.createElement(
          "div",
          null,
          React.createElement(
            "label",
            { style: { fontSize: 13 } },
            "Email",
            React.createElement("br"),
            React.createElement("input", {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              style: { width: "100%", padding: "0.4rem" },
              required: true
            })
          )
        ),
        // Category field
        React.createElement(
          "div",
          null,
          React.createElement(
            "label",
            { style: { fontSize: 13 } },
            "Category (optional)",
            React.createElement("br"),
            React.createElement("input", {
              type: "text",
              value: category,
              onChange: (e) => setCategory(e.target.value),
              style: { width: "100%", padding: "0.4rem" },
              placeholder: "e.g. IT hardware, services"
            })
          )
        ),
        // Submit button
        React.createElement(
          "button",
          {
            type: "submit",
            disabled: loading || !name.trim() || !email.trim(),
            style: {
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: 6,
              border: "none",
              cursor:
                loading || !name.trim() || !email.trim()
                  ? "not-allowed"
                  : "pointer",
              opacity: loading || !name.trim() || !email.trim() ? 0.6 : 1
            }
          },
          loading ? "Adding..." : "Add vendor"
        ),
        error &&
          React.createElement(
            "p",
            { style: { color: "red", fontSize: 13, marginTop: "0.25rem" } },
            error
          )
      )
    ),

    // ---- Section: Vendors list ----
    React.createElement(
      "section",
      null,
      React.createElement("h2", { style: { marginTop: 0 } }, "Vendors"),

      initialLoading
        ? React.createElement(
            "p",
            { style: { fontSize: 14, color: "#777" } },
            "Loading vendors..."
          )
        : vendors.length === 0
        ? React.createElement(
            "p",
            { style: { fontSize: 14, color: "#777" } },
            "No vendors yet. Add one above."
          )
        : React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14
              }
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                ["Name", "Email", "Category", "Added", "Actions"].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        textAlign: "left",
                        borderBottom: "1px solid #ddd",
                        padding: "0.5rem"
                      }
                    },
                    h
                  )
                )
              )
            ),
            React.createElement(
              "tbody",
              null,
              vendors.map((v) =>
                React.createElement(
                  "tr",
                  { key: v.id },
                  React.createElement(
                    "td",
                    {
                      style: {
                        borderBottom: "1px solid #f0f0f0",
                        padding: "0.5rem"
                      }
                    },
                    v.name
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        borderBottom: "1px solid #f0f0f0",
                        padding: "0.5rem"
                      }
                    },
                    v.email
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        borderBottom: "1px solid #f0f0f0",
                        padding: "0.5rem"
                      }
                    },
                    v.category || "-"
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        borderBottom: "1px solid #f0f0f0",
                        padding: "0.5rem"
                      }
                    },
                    formatDate(v.createdAt)
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        borderBottom: "1px solid #f0f0f0",
                        padding: "0.5rem",
                        textAlign: "center"
                      }
                    },
                    React.createElement(
                      "button",
                      {
                        onClick: () => handleDeleteVendor(v.id),
                        style: {
                          padding: "0.25rem 0.5rem",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #e00",
                          background: "#fff5f5",
                          cursor: "pointer"
                        }
                      },
                      "Delete"
                    )
                  )
                )
              )
            )
          )
    )
  );
}
