export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const form = await request.formData();

    const trap = (form.get("company_website") || "").toString().trim();
    if (trap) return new Response("ok", { status: 200 });

    const TO_EMAIL = (env.TO_EMAIL as string) || "info@keystonematrix.com";
    const FROM_EMAIL = (env.FROM_EMAIL as string) || "info@keystonematrix.com";
    const API_KEY = env.MAILCHANNELS_API_KEY as string;

    if (!API_KEY) return new Response("MAILCHANNELS_API_KEY missing", { status: 500 });

    const fields: Record<string, string> = {
      "Buyer Name": (form.get("buyer_name") || "").toString(),
      "Phone": (form.get("buyer_phone") || "").toString(),
      "Email": (form.get("buyer_email") || "").toString(),
      "Company": (form.get("buyer_company") || "").toString(),

      "States": (form.get("states") || "").toString(),
      "Counties": (form.get("counties") || "").toString(),

      "Price Min": (form.get("price_min") || "").toString(),
      "Price Max": (form.get("price_max") || "").toString(),
      "Acres Min": (form.get("acres_min") || "").toString(),
      "Acres Max": (form.get("acres_max") || "").toString(),

      "Close Speed": (form.get("close_speed") || "").toString(),
      "Assignments": (form.get("assignments") || "").toString(),

      "Legal Access Required": (form.get("legal_access_req") || "").toString(),
      "Flood Tolerance": (form.get("flood_tolerance") || "").toString(),
      "HOA Tolerance": (form.get("hoa_tolerance") || "").toString(),
      "Utilities Preference": (form.get("utilities_pref") || "").toString(),

      "Notes": (form.get("buyer_notes") || "").toString(),
    };

    const subject = `New Buyer Interest — ${fields["Buyer Name"] || "Buyer"} — $${fields["Price Min"] || "?"}–$${fields["Price Max"] || "?"} — ${fields["Acres Min"] || "?"}–${fields["Acres Max"] || "?"} acres`;

    const html = renderEmail({
      title: "New Buyer Buy Box",
      subtitle: "Buyer interest submitted (used for matching opportunities).",
      quick: [
        ["Name", fields["Buyer Name"] || "—"],
        ["Markets", fields["States"] || "—"],
        ["Price Range", `$${fields["Price Min"] || "—"} – $${fields["Price Max"] || "—"}`],
        ["Acre Range", `${fields["Acres Min"] || "—"} – ${fields["Acres Max"] || "—"}`],
        ["Assignments", fields["Assignments"] || "—"],
      ],
      sections: [
        { name: "Buyer", items: [
          ["Name", fields["Buyer Name"]],
          ["Company", fields["Company"]],
          ["Phone", fields["Phone"]],
          ["Email", fields["Email"]],
        ]},
        { name: "Markets", items: [
          ["States", fields["States"]],
          ["Counties", fields["Counties"]],
        ]},
        { name: "Numbers", items: [
          ["Price Min", fields["Price Min"]],
          ["Price Max", fields["Price Max"]],
          ["Acres Min", fields["Acres Min"]],
          ["Acres Max", fields["Acres Max"]],
          ["Close Speed", fields["Close Speed"]],
          ["Assignments Accepted", fields["Assignments"]],
        ]},
        { name: "Requirements", items: [
          ["Legal Access Required", fields["Legal Access Required"]],
          ["Floodplain Tolerance", fields["Flood Tolerance"]],
          ["HOA Tolerance", fields["HOA Tolerance"]],
          ["Utilities Preference", fields["Utilities Preference"]],
        ]},
        { name: "Notes", items: [["Notes", fields["Notes"]]]},
      ],
      footer: {
        company: "Keystone Matrix Properties LLC",
        replyTo: "info@keystonematrix.com",
        phone: "406-925-2472",
      }
    });

    const payload = {
      personalizations: [{ to: [{ email: TO_EMAIL }] }],
      from: { email: FROM_EMAIL, name: "Keystone Matrix Properties LLC" },
      subject,
      content: [{ type: "text/html", value: html }],
    };

    const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": API_KEY },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(`Email send failed: ${resp.status} ${text}`, { status: 502 });
    }

    return new Response("ok", { status: 200 });
  } catch (e: any) {
    return new Response(`Server error: ${e?.message || e}`, { status: 500 });
  }
};

// same helpers as seller.ts (kept duplicated for simplicity in v1)
function escapeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmail(opts: {
  title: string;
  subtitle: string;
  quick: [string, string][];
  sections: { name: string; items: [string, string][] }[];
  footer: { company: string; replyTo: string; phone: string };
}) {
  const gold = "#b8912e";
  const line = "#e9e6df";
  const ink = "#151515";
  const muted = "#4b4b4b";
  const card = "#fbfaf7";

  const quickRows = opts.quick.map(([k,v]) => `
    <tr>
      <td style="padding:8px 10px;border:1px solid ${line};font-weight:700;background:#fff;">${escapeHtml(k)}</td>
      <td style="padding:8px 10px;border:1px solid ${line};color:${muted};background:#fff;">${escapeHtml(v || "—")}</td>
    </tr>
  `).join("");

  const sections = opts.sections.map(sec => {
    const rows = sec.items.map(([k,v]) => `
      <tr>
        <td style="padding:8px 10px;border:1px solid ${line};font-weight:700;width:34%;background:#fff;">${escapeHtml(k)}</td>
        <td style="padding:8px 10px;border:1px solid ${line};color:${muted};background:#fff;">${escapeHtml(v || "—")}</td>
      </tr>
    `).join("");
    return `
      <div style="margin-top:14px;">
        <div style="font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:${gold};margin:0 0 8px;">${escapeHtml(sec.name)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rows}</table>
      </div>
    `;
  }).join("");

  return `
  <div style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:760px;margin:0 auto;padding:18px;">
      <div style="border:1px solid ${line};border-radius:14px;overflow:hidden;">
        <div style="padding:16px 16px 12px;background:linear-gradient(180deg,#fff 0%, ${card} 100%);border-bottom:1px solid ${line};">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${gold};font-weight:800;">${escapeHtml(opts.footer.company)}</div>
          <div style="font-size:20px;font-weight:900;color:${ink};margin-top:6px;">${escapeHtml(opts.title)}</div>
          <div style="color:${muted};margin-top:6px;">${escapeHtml(opts.subtitle)}</div>
        </div>

        <div style="padding:16px;background:#fff;">
          <div style="font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:${gold};margin:0 0 8px;">Quick Summary</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${quickRows}</table>

          ${sections}

          <div style="margin-top:18px;padding-top:12px;border-top:1px solid ${line};color:${muted};font-size:13px;">
            Reply to: <a href="mailto:${escapeHtml(opts.footer.replyTo)}" style="color:${ink};text-decoration:none;font-weight:700;">${escapeHtml(opts.footer.replyTo)}</a>
            &nbsp;•&nbsp;
            Phone: <a href="tel:+14069252472" style="color:${ink};text-decoration:none;font-weight:700;">${escapeHtml(opts.footer.phone)}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}