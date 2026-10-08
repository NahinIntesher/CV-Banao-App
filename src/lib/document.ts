import { CV, filledEntry, fonts, layoutOf, purposeOf, safeUrl } from "./model";
export const escapeHTML = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
export function documentHTML(
  cv: CV,
  fontData?: { regular: string; bold: string },
  preview = false,
) {
  const d = cv.design,
    p = cv.profile,
    layout = layoutOf(cv.template),
    purpose = purposeOf(cv.template);
  const center =
    layout === "editorial" ||
    (layout === "classic" && ["academic", "phd"].includes(purpose));
  const fontFace = fontData
    ? `@font-face{font-family:CVFont;src:url(data:font/ttf;base64,${fontData.regular}) format('truetype');font-weight:400}@font-face{font-family:CVFont;src:url(data:font/ttf;base64,${fontData.bold}) format('truetype');font-weight:700}`
    : "";
  const family = fonts.find((f) => f.id === d.font)?.name ?? "Georgia";
  const e = escapeHTML;
  const links = (["website", "linkedin", "scholar"] as const)
    .filter((k) => p[k])
    .map((k) =>
      safeUrl(p[k])
        ? `<a href="${e(safeUrl(p[k]))}">${e(p[k].replace(/^https?:\/\//, ""))}</a>`
        : e(p[k]),
    )
    .join(" &nbsp; | &nbsp; ");
  const description = (text: string) =>
    text
      .split("\n")
      .filter((l) => l.trim())
      .map((l) =>
        /^[•*\-]\s/.test(l)
          ? `<div class="bullet"><span>•</span><span>${e(l.replace(/^[•*\-]\s/, ""))}</span></div>`
          : `<p>${e(l)}</p>`,
      )
      .join("");
  const entry = (x: CV["sections"][number]["entries"][number]) =>
    `<div class="entry"><div class="entry-top">${x.title ? `<h3>${e(x.title)}</h3>` : ""}${x.date ? `<span>${e(x.date)}</span>` : ""}</div>${x.subtitle || x.location ? `<div class="entry-sub"><span>${e(x.subtitle)}</span><span>${e(x.location)}</span></div>` : ""}${x.url ? `<a href="${e(safeUrl(x.url))}">${e(x.url)}</a>` : ""}${description(x.description)}</div>`;
  const section = (title: string, body: string) =>
    `<section><h2>${e(title)}</h2>${body}</section>`;
  const content =
    (cv.summary
      ? section(
          purpose === "industry" ? "Professional summary" : "Profile",
          description(cv.summary),
        )
      : "") +
    cv.sections
      .filter((s) => s.visible && s.entries.some(filledEntry))
      .map((s) =>
        section(s.title, s.entries.filter(filledEntry).map(entry).join("")),
      )
      .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(p.name || "CV Banao")}</title><style>${fontFace}*{box-sizing:border-box}html,body{margin:0;padding:0;color:${d.textColor};background:white}body{font-family:${fontData ? "CVFont" : `"${family}",Georgia`};font-size:${d.fontSize}pt;line-height:${d.lineHeight};-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:${d.paper === "A4" ? "A4" : "letter"};margin:${d.margins}pt;${d.pageNumbers ? "@bottom-right{content:counter(page);font-size:8pt;color:#707684}" : ""}}.paper{${preview ? `width:${d.paper === "A4" ? 794 : 816}px;min-height:${d.paper === "A4" ? 1123 : 1056}px;padding:${d.margins * 1.333}px;transform-origin:top left;` : ""}}header{text-align:${center ? "center" : "left"};margin-bottom:12pt;${layout === "rail" ? `border-left:4pt solid ${d.accent};padding-left:12pt;` : layout === "banner" ? `border:1pt solid ${d.accent};padding:14pt;` : layout === "editorial" ? `border-bottom:1.5pt solid ${d.accent};padding-bottom:15pt;` : purpose === "industry" ? `border-bottom:2pt solid ${d.accent};padding-bottom:12pt;` : ""}}h1{font-size:${layout === "editorial" ? 32 : layout === "minimal" ? 25 : 28}pt;line-height:1.2;margin:0;color:${d.accent};font-weight:700}.headline{font-size:${d.fontSize + 1.5}pt;margin:5pt 0}.contact,.links{font-size:${d.fontSize - 1}pt;color:#525969;margin-top:5pt}a{color:${d.accent};text-decoration:none;overflow-wrap:anywhere}section{margin-top:${d.spacing}pt}h2{font-size:${d.fontSize + 1.5}pt;color:${d.accent};margin:0 0 7pt;padding-bottom:5pt;${purpose === "academic" ? "text-transform:uppercase;" : ""}${layout === "minimal" ? "" : layout === "banner" ? `background:${d.accent}10;padding:5pt 8pt;` : layout === "rail" ? `border-left:3pt solid ${d.accent};padding-left:8pt;border-bottom:.7pt solid ${d.accent};` : layout === "editorial" ? `letter-spacing:1.4pt;border-bottom:1.2pt solid ${d.accent};` : purpose === "industry" ? "" : `border-bottom:.7pt solid ${d.accent};`}break-after:avoid;page-break-after:avoid}h3{font-size:${d.fontSize}pt;margin:0;font-weight:700}.entry{margin-bottom:10pt}.entry-top{display:flex;justify-content:space-between;gap:12pt;break-after:avoid}.entry-top>span,.entry-sub{font-size:${d.fontSize - 1}pt;color:#525969}.entry-sub{display:flex;justify-content:space-between;gap:10pt;margin:2pt 0 4pt}p{margin:3pt 0;white-space:pre-wrap;overflow-wrap:anywhere;orphans:2;widows:2}.bullet{display:flex;gap:7pt;margin:3pt 0}.bullet>span:last-child{flex:1}.empty{padding:50pt 0;text-align:center;color:#8c8499}@media print{.paper{width:auto;min-height:0;transform:none!important;padding:0!important}}</style></head><body><article class="paper"><header><h1>${e(p.name || "Your name")}</h1>${p.headline ? `<p class="headline">${e(p.headline)}</p>` : ""}<div class="contact">${e([p.email, p.phone, p.location].filter(Boolean).join(" | "))}</div>${links ? `<div class="links">${links}</div>` : ""}</header>${content || '<div class="empty">Your next chapter starts here.<p>Add your details to build your CV.</p></div>'}</article>${preview ? `<script>function fit(){var p=document.querySelector('.paper');var s=Math.min(1,(innerWidth-24)/${d.paper === "A4" ? 794 : 816});p.style.transform='scale('+s+')';document.body.style.height=p.scrollHeight*s+'px'}fit();addEventListener('resize',fit)</script>` : ""}</body></html>`;
}
