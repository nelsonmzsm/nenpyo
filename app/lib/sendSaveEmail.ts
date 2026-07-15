import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = "https://nenpyo-sandy.vercel.app";
const FROM = "じぶん年表 <nenpyo@otonaki.com>";

export async function sendSaveEmail({
  to,
  nickname,
  eventCount,
  editToken,
  isPublic,
}: {
  to: string;
  nickname: string;
  eventCount: number;
  editToken: string;
  isPublic: boolean;
}) {
  if (!resend) return;

  const editUrl = `${APP_URL}/edit/${editToken}`;
  const visibilityNote = isPublic
    ? "現在「みんなの年表」に公開中です。編集ページで非公開に変更することもできます。"
    : "現在は非公開設定です。編集ページで公開に変更することもできます。";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `【じぶん年表】${nickname}さんの年表が保存されました`,
    html: `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1C1108;background:#FDFBF4;">
  <div style="font-size:22px;font-weight:bold;margin-bottom:4px;">🐆 じぶん年表</div>
  <hr style="border:none;border-top:1px solid #E8DCC8;margin:16px 0;" />
  <h2 style="font-size:18px;font-weight:bold;margin:0 0 12px;">年表が保存されました</h2>
  <p style="font-size:15px;line-height:1.8;margin:0 0 8px;">
    <strong>${nickname}</strong>さんの「じぶん年表」（${eventCount}項目）が保存されました。
  </p>
  <p style="font-size:14px;line-height:1.7;color:#6B7280;margin:0 0 24px;">${visibilityNote}</p>
  <a href="${editUrl}"
    style="display:inline-block;background:#D97706;color:#fff;text-decoration:none;padding:14px 28px;font-size:15px;font-weight:bold;letter-spacing:0.05em;">
    年表を編集する →
  </a>
  <p style="font-size:13px;color:#6B7280;margin:24px 0 0;line-height:1.7;">
    このリンクは外部に共有しないでください。<br/>
    リンクを知っている方なら誰でも編集・削除できます。
  </p>
  <hr style="border:none;border-top:1px solid #E8DCC8;margin:32px 0 16px;" />
  <p style="font-size:12px;color:#9CA3AF;line-height:1.8;margin:0;">
    このメールは「じぶん年表」への保存登録に伴い送信されました。<br/>
    メールアドレスは年表の管理・お知らせ以外には使用しません。第三者への提供も行いません。
  </p>
</div>`,
  });
}
