export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const form = await request.formData();

    // Simple bot trap
    const trap = (form.get("company_website") || "").toString().trim();
    if (trap) return new Response("ok", { status: 200 });

    const TO_EMAIL = (env.TO_EMAIL as string) || "info@keystonematrix.com";
    const FROM_EMAIL = (env.FROM_EMAIL as string) || "info@keystonematrix.com";
    const API_KEY = env.MAILCHANNELS_API_KEY as string;

    if (!API_KEY) {
      return new Response("MAILCHANNELS_API_KEY missing", { status: 500 });
    }

    const fields: Record<string, string> = {
      "Seller Name": (form.get("seller_name") || "").toString(),
      "Phone": (form.get("seller_phone") || "").toString(),
      "Email": (form.get("seller_email") || "").toString(),
      "Owner?": (form.get("is_owner") || "").toString(),
      "Other Decision Makers": (form.get("other_decision_makers") || "").toString(),

      "State": (form.get("state") || "").toString(),
      "County": (form.get("county") || "").toString(),
      "Parcel/APN": (form.get("apn") || "").toString(),
      "Acres": (form.get("acres") || "").toString(),
      "Location": (form.get("location") || "").toString(),

      "Road Access": (form.get("road_access") || "").toString(),
      "Legal Access": (form.get("legal_access") || "").toString(),
      "Power": (form.get("power") || "").toString(),
      "Water": (form.get("water") || "").toString(),
      "Sewer": (form.get("sewer") || "").toString(),
      "Zoning": (form.get("zoning") || "").toString(),
      "HOA": (form.get("hoa") || "").toString(),
      "Floodplain": (form.get("floodplain") || "").toString(),

      "Taxes (annual)": (form.get("taxes") || "").toString(),
      "Title Status": (form.get("title_status") || "").toString(),

      "Asking Price": (form.get("asking_price") || "").toString(),
      "Minimum Price": (form.get("min_price") || "").toString(),
      "Timeline": (form.get("timeline") || "").toString(),
      "Reason": (form.get("reason") || "").toString(),
      "Notes": (form.get("notes") || "").toString(),
    };

    const subject = `New Seller Submission — ${fields["County"] || "County?"}, ${fields["State"] || "State?"} — ${fields["Acres"] || "?"} acres`;

    const html = renderEmail({
      title: "New Seller Intake",
      subtitle: "Land submission received (review before any buyer distribution).",
      quick: [
        ["County / State", `${fields["County"] || "—"}, ${fields["State"] || "—"}`],
        ["Acres", fields["Acres"] || "—"],
        ["Parcel/APN", fields["Parcel/APN"] || "—"],
        ["Asking", fields["Asking Price"] || "—"],
        ["Timeline", fields["Timeline"] || "—"],
      ],
      sections: [
        { name: "Seller", items: [
          ["Name", fields["Seller Name"]],
          ["Phone", fields["Phone"]],
          ["Email", fields["Email"]],
          ["Owner?", fields["Owner?"]],
          ["Other Decision Makers", fields["Other Decision Makers"]],
        ]},
        { name: "Property", items: [
          ["Location", fields["Location"]],
          ["Parcel/APN", fields["Parcel/APN"]],
          ["County", fields["County"]],
          ["State", fields["State"]],
          ["Acres", fields["Acres"]],
          ["Zoning", fields["Zoning"]],
        ]},
        { name: "Access & Utilities", items: [
          ["Road Access", fields["Road Access"]],
          ["Legal Access", fields["Legal Access"]],
          ["Power", fields["Power"]],
          ["Water", fields["Water"]],
          ["Sewer", fields["Sewer"]],
        ]},
        { name: "Constraints", items: [
          ["HOA", fields["HOA"]],
          ["Floodplain", fields["Floodplain"]],
          ["Taxes (annual)", fields["Taxes (annual)"]],
          ["Title Status", fields["Title Status"]],
        ]},
        { name: "Deal Terms", items: [
          ["Asking Price", fields["Asking Price"]],
          ["Minimum Price", fields["Minimum Price"]],
          ["Timeline", fields["Timeline"]],
          ["Reason", fields["Reason"]],
        ]},
        { name: "Notes", items: [
          ["Notes", fields["Notes"]],
        ]},
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
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
      },
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