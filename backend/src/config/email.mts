// // src/config/email.ts
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const host = process.env.MAILTRAP_HOST;
// const port = process.env.MAILTRAP_PORT;
// const user = process.env.MAILTRAP_USER;
// const pass = process.env.MAILTRAP_PASS;

// if (!host || !port || !user || !pass) {
//   throw new Error("Mailtrap SMTP settings are not fully configured in .env");
// }

// const transporter = nodemailer.createTransport({
//   host,
//   port: Number(port),
//   auth: {
//     user,
//     pass
//   }
// });

// export default transporter;

// src/config/email.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!user || !pass) {
  throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // false for 587, true for 465
  auth: {
    user,
    pass
  }
});

export default transporter;
