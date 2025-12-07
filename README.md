# 🧠 AI-Powered RFP Management System
### Aerchain Technical Assessment

This project implements an **end-to-end AI-powered RFP (Request for Proposal) management system** used by a procurement manager to streamline vendor selection.
The system transforms natural-language procurement needs into structured RFPs, sends them to vendors via real email, receives vendor responses from Gmail, extracts structured proposal data using AI, and provides AI-based vendor comparison & recommendations.

---

## 🚀 Features

### ✔ AI-Powered RFP Creation
Enter plain English like:  
> "We need 20 laptops, budget $50k, delivery 30 days…"  
AI converts this into a structured RFP with fields such as budget, delivery timeline, payment terms, warranty, and title.

### ✔ Vendor Management
Create and list vendors (name, email, category).

### ✔ Real Email Integration (Gmail SMTP + IMAP)
- Send RFPs via **Gmail SMTP**
- Receive vendor replies using **Gmail IMAP**
- Subject line embeds IDs so replies automatically map back to the correct Vendor & RFP

### ✔ AI Proposal Extraction
Vendor replies are unstructured. AI extracts:
- Total Price
- Delivery Days
- Payment Terms
- Warranty Months
- Notes

### ✔ AI Proposal Comparison
AI ranks proposals and recommends the best vendor with scores + reasoning.

### ✔ Modern Web Interface
React frontend for RFP creation, vendor management, sending emails, viewing proposals, and running comparisons.

---

## 🏗️ Architecture

```
                        React Frontend (Vite + TS)
        ┌─────────────────────────────────────────────────────┐
        │ RFP creation UI, vendor pages, RFP detail workflow  │
        └───────────────▲─────────────────────────────────────┘
                        │ HTTP (Axios)
        ┌───────────────┴─────────────────────────────────────┐
        │              Express.js Backend                      │
        │  - AI RFP creation                                   │
        │  - Vendor CRUD                                       │
        │  - Send RFP emails (Gmail SMTP)                      │
        │  - Receive vendor replies (Gmail IMAP)               │
        │  - AI proposal parsing                               │
        │  - AI comparison & recommendation                    │
        └───────────────▲─────────────────────────────────────┘
                        │ Prisma ORM
                ┌───────┴─────────┐
                │   PostgreSQL     │
                └───────────────────┘

                Gmail SMTP + IMAP + OpenAI API
```

---

## 📂 Project Structure

```
project/
│
├── server/
│   ├── src/
│   │   ├── config/        # SMTP, IMAP, DB, OpenAI
│   │   ├── routes/        # RFPs, Vendors, Proposals
│   │   ├── services/      # Email, IMAP, AI, proposals, comparison
│   │   └── app.ts
│   └── prisma/
│       └── schema.prisma
│
└── client/
    ├── src/
    │   ├── api/           # Axios API clients
    │   ├── components/    # Generic components
    │   ├── pages/         # RFP detail, vendor list, creator
    │   └── App.tsx
```

---

## ⚙️ Tech Stack

### **Backend**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Gmail SMTP (sending)
- Gmail IMAP (receiving)
- OpenAI API

### **Frontend**
- React + Vite
- TypeScript
- Axios
- React Router

---

## 📧 Email Integration (Required by Assessment)

### Sending Emails — Gmail SMTP

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

Requires **Gmail App Password**.

---

### Receiving Emails — Gmail IMAP

```
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

We fetch **unseen** messages and parse subject lines to identify RFP + Vendor.

---

### Subject Line Encoding

Outbound emails include:

```
RFP: <title> [RFP-ID:3] [VENDOR-ID:2]
```

---

## 🧠 AI Integration

### 1️⃣ RFP Creation (Natural Language → Structured RFP)

### 2️⃣ Proposal Extraction (Email → Structured JSON)

### 3️⃣ Proposal Comparison (AI Ranking & Recommendation)

---

## ▶️ Running the Project

### Backend Setup

```
cd server
npm install
npx prisma migrate dev
npm run dev
```

Backend runs at **http://localhost:4000**

---

### Frontend Setup

```
cd client
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## 📝 Demo Script

1. Add vendors  
2. Create AI-powered RFP  
3. Send RFP emails  
4. Vendor replies in Gmail  
5. Process replies via IMAP  
6. Run AI comparison  

---

## 🧩 Assumptions

- Single user (no auth required)
- One proposal per vendor per RFP
- Basic MIME parsing
- Gmail app password required

---

## ✔ Requirements Mapping

All required features implemented:
- RFP creation (AI)
- Vendor management
- Email send + receive
- Proposal parsing (AI)
- Comparison (AI)
- Clean UI
