/**
 * Generic Official Document & Application (निवेदन) Renderer
 * Handles official OCR schedules, IRD applications, and general legal petitions.
 *
 * Implements standard Nepali government document conventions:
 *  1. Header (अनुसूची / कार्यालय ढाँचा): Center aligned with prominent border
 *  2. Ref / Date line: 3-column table (पत्र संख्या, चलानी/टोकन, मिति)
 *  3. Recipient (कार्यालय / सम्बोधन): Left aligned (श्रीमान् ...)
 *  4. Subject (विषय ः ...): Center aligned, bold, underlined
 *  5. Salutation (महोदय,): Distinct bold line
 *  6. Body: Justified paragraphs with Nepali paragraph indent
 *  7. Enclosures (संलग्न कागजातहरू / तपसिल): Structured numbered items
 *  8. Applicant block (निवेदकको विवरण): STRICTLY RIGHT-ALIGNED table layout
 */

import type { RendererContext, LayoutFlags } from '../types';
import { toNepaliAddress, toDevanagariDigits } from '../helpers';

export function renderGenericDoc(ctx: RendererContext, flags: LayoutFlags): string {
  const { orderData, formData, orderDate, replacePlaceholders } = ctx;
  const { showHeader, showFooter, showDateRef, showWatermark, showEmblem } = flags;
  const { docLayout } = ctx;

  // ── 1. Applicant details resolution ──────────────────────────────────────
  const applicantName =
    formData['applicant.full_name'] ||
    formData['shareholder_1.full_name'] ||
    formData['director.md_name'] ||
    formData['director.full_name'] ||
    formData['name'] ||
    formData['full_name'] ||
    'निवेदक';

  const rawAddress =
    formData['applicant.address'] ||
    formData['applicant.permanent_address'] ||
    formData['shareholder_1.address'] ||
    formData['address'] ||
    '';
  const address = toNepaliAddress(rawAddress);

  const citizenship =
    formData['applicant.citizenship_no'] ||
    formData['shareholder_1.citizenship_no'] ||
    formData['citizenship_no'] ||
    '';

  const phone =
    formData['applicant.phone'] ||
    formData['shareholder_1.phone'] ||
    formData['phone'] ||
    '';

  const email =
    formData['applicant.email'] ||
    formData['shareholder_1.email'] ||
    formData['email'] ||
    '';

  // Helper to normalize all variants of newlines, colon characters, and quotation marks (avoiding Kalimati missing glyph boxes)
  const normalizeText = (t: string) =>
    (t || '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[“”„‟«»]/g, '"')
      .replace(/[‘’‚‛]/g, "'")
      .replace(/\s*ः\s*/g, ': ');

  // ── 2. Header text resolution ───────────────────────────────────────────
  const headerRaw = docLayout?.header ||
    `नेपाल सरकार\nअर्थ मन्त्रालय\nआन्तरिक राजस्व विभाग\nकरदाता सेवा कार्यालय`;

  const populatedHeader = normalizeText(replacePlaceholders(headerRaw));

  const headerLines = populatedHeader
    .split('\n')
    .map((l: string) => l.trim())
    .filter(Boolean);

  const isSchedule = headerLines.length > 0 && /अनुसूची/i.test(headerLines[0]);

  // ── 3. Office & Addressee (Continuous title for AOA/Act, or addressed recipient) ──
  const officeRaw = docLayout?.office ||
    `श्रीमान् कर अधिकृत ज्यू,\nकरदाता सेवा कार्यालय।`;

  let populatedOffice = normalizeText(replacePlaceholders(officeRaw));
  // Clean up duplicate "प्राइभेट लिमिटेड" if company.name_np already includes it
  populatedOffice = populatedOffice
    .replace(/(प्राइभेट\s+लिमिटेड(?:\s*\([^)]*\))?)\s+प्राइभेट\s+लिमिटेड/gu, '$1')
    .replace(/^(कम्पनी ऐन[^\n]+)\n+([^\n]+)\n+(नियमावली)/gu, '$1 $2 $3');

  const isCompanyActTitle = /^कम्पनी\s+ऐन/u.test(populatedOffice.trim());
  let officeHtml = '';
  if (populatedOffice) {
    if (isCompanyActTitle) {
      // Render as a single, continuous, elegant heading block without forced \n breaks
      const continuousTitle = populatedOffice.replace(/\n+/g, ' ').trim();
      officeHtml = `
        <div class="office-block" style="text-align:left;font-size:13.5px;font-weight:bold;color:#0f172a;line-height:1.55;margin-bottom:6px;">
          ${continuousTitle}
        </div>
      `;
    } else {
      const officeLines = populatedOffice
        .replace(/(कार्यालय\s*,?)\s*([^\n<]+)/gu, '$1\n$2')
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l && !/^[\.\s।\-_]+$/.test(l))
        .join('<br/>');
      officeHtml = `
        <div class="office-block" style="text-align:left;font-size:13.5px;font-weight:bold;color:#0f172a;line-height:1.45;margin-bottom:6px;">
          ${officeLines}
        </div>
      `;
    }
  }

  // ── 4. Subject Line ──────────────────────────────────────────────────────
  const subjectRaw = docLayout?.subject ||
    `विषय: व्यक्तिगत स्थायी लेखा नम्बर (PAN) दर्ता गरी प्रमाणपत्र पाउँ बारे।`;

  let populatedSubject = normalizeText(replacePlaceholders(subjectRaw))
    .replace(/\n+/g, ' ')
    .trim();

  // Ensure standard "विषय: " prefix
  if (!/^विषय\s*[:]/u.test(populatedSubject)) {
    populatedSubject = `विषय: ${populatedSubject}`;
  } else {
    populatedSubject = populatedSubject.replace(/^विषय\s*[:]\s*/u, 'विषय: ');
  }

  // ── 5. Body Text ─────────────────────────────────────────────────────────
  const defaultBody = docLayout?.body ||
    `महोदय,\n\nउपरोक्त विषयमा म निवेदकले प्रचलित कानुन तथा आन्तरिक राजस्व विभागको नियमानुसार व्यक्तिगत स्थायी लेखा नम्बर (PAN) प्राप्त गर्नका लागि यो निवेदन पेश गरेको छु।\n\n१. निवेदकको पूरा नाम थर: {{applicant.full_name}}\n२. नागरिकता प्रमाणपत्र नम्बर: {{applicant.citizenship_no}}\n३. स्थायी ठेगाना: {{applicant.permanent_address}}\n४. मोबाइल नम्बर: {{applicant.phone}}\n\nमाथि उल्लिखित सम्पूर्ण विवरण सत्य, तथ्य र मेरो नागरिकता प्रमाणपत्र बमोजिम रहेको प्रमाणित गर्दछु।`;

  let populatedBody = normalizeText(replacePlaceholders(defaultBody)).trim();

  // Extract standalone "महोदय," if present at the beginning
  let hasSalutation = false;
  if (/^महोदय\s*[,:]/u.test(populatedBody)) {
    hasSalutation = true;
    populatedBody = populatedBody.replace(/^महोदय\s*[,:]\s*/u, '').trim();
  }

  // Helper to test if a line is a sub-list item (e.g. (क), (ख), (a), (1), etc.)
  const isSubItem = (line: string) => {
    const trimmed = line.trim();
    return (
      /^\([क-हa-zA-Z0-9०-९ivxIVX]+\)/u.test(trimmed) ||
      /^[०-९0-9a-zA-Z]\)/u.test(trimmed) ||
      /^\s{2,}/.test(line) ||
      /^\t/.test(line)
    );
  };

  const bodyParagraphs = populatedBody
    .split('\n\n')
    .map((p: string) => p.trim())
    .filter(Boolean)
    .map((p: string) => {
      const lines = p.split('\n').map((l: string) => l.trim()).filter(Boolean);

      // Render each line or group, ensuring any line matching परिच्छेद is strictly centered & bold
      let html = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^परिच्छेद/u.test(line)) {
          html += `<div style="text-align:center;font-weight:bold;font-size:14.5px;color:#0f172a;margin:18px 0 8px 0;letter-spacing:0.3px;">${line}</div>`;
        } else if (isSubItem(line)) {
          html += `<div style="padding-left:34px;line-height:1.5;margin-bottom:3px;font-size:13px;text-align:justify;">${line}</div>`;
        } else if (/^[०-९0-9]+[.)]/u.test(line)) {
          html += `<div style="padding-left:14px;line-height:1.5;margin-bottom:3px;font-size:13.5px;text-align:justify;">${line}</div>`;
        } else {
          html += `<p style="margin-bottom:4px;line-height:1.5;text-align:justify;text-indent:1.4rem;font-size:13.5px;">${line}</p>`;
        }
      }

      return html;
    })
    .join('');

  // ── 6. Enclosures / Declaration (संलग्न कागजातहरू / तपसिल) ───────────────
  const declarationRaw = docLayout?.declaration || '';
  let enclosureHtml = '';

  if (declarationRaw) {
    const populatedDec = normalizeText(replacePlaceholders(declarationRaw)).trim();
    const decLines = populatedDec.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (decLines.length > 0) {
      const heading = decLines[0];
      const items = decLines.slice(1);
      enclosureHtml = `
        <div style="margin-top:6px;margin-bottom:6px;">
          <div style="font-weight:bold;font-size:13.5px;color:#0f172a;margin-bottom:3px;">${heading}</div>
          ${items.map((it: string) => {
            const padLeft = isSubItem(it) ? '34px' : '14px';
            return `<div style="padding-left:${padLeft};line-height:1.45;font-size:12.8px;color:#1e293b;margin-bottom:2px;">${it}</div>`;
          }).join('')}
        </div>
      `;
    }
  }

  // ── 7. Header Block Rendering (No border) ────────────────────────────────
  let headerHtml = '';
  if (showHeader && headerLines.length > 0) {
    if (isSchedule) {
      headerHtml = `
        <div class="schedule-header" style="text-align:center;padding-bottom:2px;margin-bottom:8px;">
          <div style="font-size:15.5px;font-weight:bold;color:#0f172a;margin-bottom:2px;letter-spacing:0.3px;">${headerLines[0]}</div>
          ${headerLines[1] ? `<div style="font-size:12.5px;color:#334155;margin-bottom:2px;font-weight:500;">${headerLines[1]}</div>` : ''}
          ${headerLines.slice(2).map((l: string) => `<div style="font-size:14px;font-weight:bold;color:#0f172a;margin-top:1px;">${l}</div>`).join('')}
        </div>
      `;
    } else {
      headerHtml = `
        <div class="letterhead" style="text-align:center;padding-bottom:4px;margin-bottom:10px;">
          ${showEmblem ? '<div class="nepal-emblem-text" style="font-size:13.5px;font-weight:bold;color:#b91c1c;margin-bottom:2px;">🇳🇵 नेपाल सरकार (Government of Nepal)</div>' : ''}
          ${headerLines.map((l: string, idx: number) => `
            <div style="font-size:${idx === 0 ? '15.5px' : idx === 1 ? '13.5px' : '13px'};font-weight:bold;color:#0f172a;line-height:1.35;">${l}</div>
          `).join('')}
        </div>
      `;
    }
  }

  return `
  <!-- A4 Sheet (Official Nepali Application Format) -->
  <div class="a4-sheet" style="border:none;outline:none;">
    ${showWatermark ? '<div class="watermark">MERO KAGAZ • OFFICIAL</div>' : ''}

    <div class="doc-content">
      <!-- 1. Header (Centered without border) -->
      ${headerHtml}

      <!-- Top Right Date -->
      <div class="date-block" style="text-align:right;font-size:13px;font-weight:bold;color:#0f172a;margin-bottom:8px;">
        मिति: <span style="font-weight:normal;">${toDevanagariDigits(orderDate)}</span>
      </div>

      <!-- 2. Addressee / Office Block (Left Aligned with address on next line or continuous title) -->
      ${officeHtml}

      <!-- 3. Subject Line (Strictly Center Aligned, Bold & Underlined) -->
      <div class="subject-block" style="text-align:center;font-size:14px;font-weight:bold;color:#0f172a;text-decoration:underline;margin:6px 0 8px 0;letter-spacing:0.3px;">
        ${populatedSubject}
      </div>

      <!-- 4. Salutation -->
      ${hasSalutation ? `
        <div class="salutation" style="font-size:13.5px;font-weight:bold;color:#0f172a;margin-bottom:4px;">
          महोदय,
        </div>
      ` : ''}

      <!-- 5. Body Paragraphs -->
      <div class="body-content" style="font-size:13.5px;color:#1e293b;line-height:1.5;">
        ${bodyParagraphs}
      </div>

      <!-- 6. Tapasil / Enclosures -->
      ${enclosureHtml}

      <!-- 7. Applicant Details (Strictly Right Aligned, pushed to right side 58% margin-left) -->
      <div style="width:42%;margin-left:58%;margin-top:14px;page-break-inside:avoid;border:none;outline:none;">
        <div class="applicant-box" style="font-size:13px;line-height:1.5;color:#1e293b;">
          <div style="font-weight:bold;font-size:13.5px;margin-bottom:4px;color:#0f172a;">निवेदक</div>
          <div style="margin-bottom:3px;"><b>नाम, थर:</b> ${applicantName}</div>
          ${citizenship ? `<div style="margin-bottom:3px;"><b>नागरिकता प्रमाणपत्र नं:</b> ${toDevanagariDigits(citizenship)}</div>` : ''}
          ${address ? `<div style="margin-bottom:3px;"><b>स्थायी ठेगाना:</b> ${address}</div>` : ''}
          ${formData['applicant.current_address'] ? `<div style="margin-bottom:3px;"><b>हालको ठेगाना:</b> ${toNepaliAddress(formData['applicant.current_address'])}</div>` : ''}
          ${formData['applicant.telephone'] ? `<div style="margin-bottom:3px;"><b>टेलिफोन:</b> ${toDevanagariDigits(formData['applicant.telephone'])}</div>` : ''}
          ${phone && phone !== '—' ? `<div style="margin-bottom:3px;"><b>मोवाईल:</b> ${toDevanagariDigits(phone)}</div>` : ''}
          ${formData['applicant.fax'] ? `<div style="margin-bottom:3px;"><b>फ्याक्स नं.:</b> ${toDevanagariDigits(formData['applicant.fax'])}</div>` : ''}
          ${formData['applicant.po_box'] ? `<div style="margin-bottom:3px;"><b>पोष्टवक्स नम्बर:</b> ${toDevanagariDigits(formData['applicant.po_box'])}</div>` : ''}
          ${email ? `<div style="margin-bottom:3px;"><b>इमेल:</b> ${email}</div>` : ''}

          <!-- Signature at the end of applicant details -->
          <div style="margin-top:10px;color:#0f172a;font-weight:bold;">दस्तखत:</div>
          <!-- 2-3 Enter Spaces for physical/digital signature -->
          <div style="line-height:18px;margin:2px 0 4px 0;">
            &nbsp;<br/>
            &nbsp;<br/>
            &nbsp;
          </div>
          <div style="margin-bottom:4px;color:#475569;letter-spacing:1px;">...................................................</div>
        </div>
      </div>
    </div>
  </div>`;
}
