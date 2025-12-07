// src/config/imap.ts
import { ImapFlow } from "imapflow";
import dotenv from "dotenv";

dotenv.config();

const imapHost = process.env.IMAP_HOST || "imap.gmail.com";
const imapPort = Number(process.env.IMAP_PORT || 993);
const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!user || !pass) {
  throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD not set for IMAP");
}

let client: ImapFlow | null = null;

export async function getImapClient() {
  client ??= new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: user!,
      pass: pass!
    }
  });

  return client;
}
