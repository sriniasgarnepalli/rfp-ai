// src/services/emailService.ts
import transporter from "../config/email.mts";
import type { Rfp, Vendor } from "@prisma/client";

const FROM = process.env.EMAIL_FROM || "rfp-system@example.com";

export async function sendRfpEmailToVendor(rfp: Rfp, vendor: Vendor) {
  // const subject = `RFP: ${rfp.title}`;
  const subject = `RFP: ${rfp.title} [RFP-ID:${rfp.id}] [VENDOR-ID:${vendor.id}]`;

  const textBody = `
Hello ${vendor.name},

You have been invited to submit a proposal for the following Request for Proposal (RFP):

Title: ${rfp.title}
Budget: ${rfp.budget ?? "Not specified"}
Delivery timeline: ${rfp.deliveryTimelineDays ?? "Not specified"} days
Payment terms: ${rfp.paymentTerms ?? "Not specified"}
Warranty: ${rfp.warrantyMonths ?? "Not specified"} months

Full description:
${rfp.description}

Please reply to this email with your proposal, including:
- Total price
- Delivery timeline
- Payment terms
- Warranty period
- Any other relevant terms and conditions.

Best regards,
Procurement Team
`.trim();

  // You can also add HTML if you want
  const htmlBody = `
    <p>Hello ${vendor.name},</p>
    <p>You have been invited to submit a proposal for the following <strong>Request for Proposal (RFP)</strong>:</p>
    <ul>
      <li><strong>Title:</strong> ${rfp.title}</li>
      <li><strong>Budget:</strong> ${rfp.budget ?? "Not specified"}</li>
      <li><strong>Delivery timeline:</strong> ${
        rfp.deliveryTimelineDays ?? "Not specified"
      } days</li>
      <li><strong>Payment terms:</strong> ${
        rfp.paymentTerms ?? "Not specified"
      }</li>
      <li><strong>Warranty:</strong> ${
        rfp.warrantyMonths ?? "Not specified"
      } months</li>
    </ul>
    <p><strong>Full description:</strong></p>
    <pre>${rfp.description}</pre>
    <p>Please reply to this email with your proposal, including:</p>
    <ul>
      <li>Total price</li>
      <li>Delivery timeline</li>
      <li>Payment terms</li>
      <li>Warranty period</li>
      <li>Any other relevant terms and conditions</li>
    </ul>
    <p>Best regards,<br/>Procurement Team</p>
  `;

  const mailOptions = {
    from: FROM,
    to: vendor.email,
    subject,
    text: textBody,
    html: htmlBody
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${vendor.email}: ${info.messageId}`);

  return info;
}
