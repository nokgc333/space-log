export const contact = {
  heading: {
    label: "05 / CONTACT",
    title: "CONTACT",
    subtitle: "ご相談",
    lead: "工程の「詰まり」から、ご相談ください。",
  },
  fields: {
    name: "お名前",
    email: "メールアドレス",
    company: "会社名",
    topic: "ご相談の種類",
    message: "内容",
    consent: "プライバシーポリシーに同意します",
  },
  consentLink: { text: "プライバシーポリシー", note: "（新しいタブで開く）" },
  optionalMark: "任意",
  topics: [
    { value: "pipeline", label: "パイプライン設計" },
    { value: "tools", label: "ツール開発" },
    { value: "fx", label: "エフェクト制作" },
    { value: "other", label: "その他" },
  ],
  submit: "送信する",
  sending: "送信中",
  results: {
    sent: "送信しました。担当者から折り返しご連絡します。",
    demo: "受け付けました。このサイトは作品のため、実際には送信されません。",
    rateLimited:
      "短時間に送信が続いたため、受け付けを止めています。時間をおいてお試しください。",
    failed:
      "送信できませんでした。入力内容はそのまま残しています。時間をおいてお試しください。",
  },
  messages: {
    required: "入力してください",
    tooLong: "文字数が多すぎます",
    email: "メールアドレスの形式で入力してください",
    singleLine: "改行などの特殊な文字は使えません",
    choose: "選択してください",
    consent: "同意が必要です",
  },
  mail: {
    subject: "お問い合わせフォームからの送信",
    labels: {
      name: "お名前",
      email: "メールアドレス",
      company: "会社名",
      topic: "ご相談の種類",
      message: "内容",
    },
    empty: "-",
  },
};
