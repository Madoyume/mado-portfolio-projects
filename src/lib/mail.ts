import { Resend } from "resend";
import { ADMIN_MESSAGES_PATH, CONTACT_MAIL_SUBJECT_PREFIX } from "./constants";
import { getMailEnv } from "./env";
import { formatDateTime } from "./format";
import { siteUrl } from "./site";

type ContactMail = {
  name: string;
  email: string;
  comment: string;
  receivedAt: string;
};

let client: Resend | undefined;

function stripControl(value: string) {
  return value.replace(/\p{Cc}/gu, " ").trim();
}

export function buildContactSubject(name: string) {
  return `${CONTACT_MAIL_SUBJECT_PREFIX}${stripControl(name)}`;
}

export function buildContactText({
  name,
  email,
  comment,
  receivedAt,
}: ContactMail) {
  return [
    "Mado-Webサイトのお問い合わせフォームから受信しました。",
    "このメールにそのまま返信すると送信者へ届きます。",
    "",
    `受信日時: ${formatDateTime(receivedAt)}`,
    `お名前  : ${name}`,
    `Email   : ${email}`,
    "",
    "--- 本文 ---",
    comment,
    "-------------",
    "",
    `管理画面: ${siteUrl()}${ADMIN_MESSAGES_PATH}`,
  ].join("\n");
}

export async function sendContactMail(input: ContactMail) {
  const env = getMailEnv();
  client ??= new Resend(env.RESEND_API_KEY);
  const { error } = await client.emails.send({
    from: env.CONTACT_MAIL_FROM,
    to: env.CONTACT_MAIL_TO,
    replyTo: input.email,
    subject: buildContactSubject(input.name),
    text: buildContactText(input),
  });
  if (error) throw new Error(`resend send failed: ${error.name}`);
}
