import { getImapClient } from "../config/imap.mts";
import { simpleParser } from "mailparser";

export type RawEmail = {
  uid: number;
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
};

export async function fetchUnseenEmails(): Promise<RawEmail[]> {
  const client = await getImapClient();
  await client.connect();

  const emails: RawEmail[] = [];
  const lock = await client.getMailboxLock("INBOX");

  try {
    const uids = await client.search({ seen: false });
    console.log("Unseen UIDs:", uids);
    if (!uids || uids.length === 0) {
      console.log("No unseen emails in Gmail inbox");
      return [];
    }

    for (const uid of uids) {
      // ---- FETCH ENVELOPE (fast) ----
      const msg = await client.fetchOne(uid, { envelope: true });

      // ---- DOWNLOAD FULL EMAIL BODY (VERY IMPORTANT: safe per UID) ----
      const { content } = await client.download(uid, null); // null = whole message
      const raw = await streamToString(content);

      // ---- Parse email ----
      const parsed = await simpleParser(raw);

      emails.push({
        uid,
        from: parsed.from?.text,
        subject: parsed.subject || msg?.envelope?.subject,
        text: parsed.text || undefined,
        html: parsed.html || undefined
      });

      // Mark as seen
      await client.messageFlagsAdd(uid, ["\\Seen"]);
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return emails;
}

// ---- Helper: Convert stream to string ----
function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    stream.on("data", (chunk) => (data += chunk.toString("utf8")));
    stream.on("end", () => resolve(data));
    stream.on("error", reject);
  });
}
