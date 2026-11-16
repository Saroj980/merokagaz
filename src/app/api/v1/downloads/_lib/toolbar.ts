/** Toolbar HTML renderer — shown above the A4 sheet, hidden on print */

import type { RendererContext } from './types';

export function renderToolbar(ctx: RendererContext): string {
  const { orderData, docSlug, docMeta } = ctx;
  const docTitleNp = orderData.document?.name_np || docMeta?.name_np || 'आधिकारिक कागजात';
  const isCompanySuite = docSlug === 'company-registration-suite';
  const isAnnualSuite = docSlug === 'annual-compliance-suite' || docSlug === 'agm-section51-annual-return';
  const isSuite = isCompanySuite || isAnnualSuite;

  const suiteLinks = isCompanySuite
    ? `<a href="#sheet-app" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">१. निवेदन</a>
       <a href="#sheet-moa" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">२. प्रबन्धपत्र</a>
       <a href="#sheet-aoa" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">३. नियमावली</a>
       <a href="#sheet-res" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">४. निर्णय</a>`
    : isAnnualSuite
    ? `<a href="#sheet-app" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">१. दरखास्त निवेदन</a>
       <a href="#sheet-bod" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">२. संचालक बैठक</a>
       <a href="#sheet-agm" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">३. साधारण सभा</a>
       <a href="#sheet-dafa51" class="btn-close" style="color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3);">४. दफा ५१ विवरण</a>`
    : '';

  const printLabel = isSuite
    ? 'सबै ४ कागजात प्रिन्ट / Save PDF'
    : 'प्रिन्ट / PDF सेभ गर्नुहोस् (Print / Save PDF)';

  return `
  <div class="toolbar no-print">
    <div class="toolbar-title">
      <span>📄 ${docTitleNp}</span>
      <span class="badge-order">${orderData.public_order_no}</span>
      <span style="color: #4ade80; font-size: 12px; font-weight: bold;">● प्रमाणीकृत (Verified)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      ${suiteLinks}
      <button type="button" class="btn-print" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>${printLabel}</span>
      </button>
      <a href="/documents/${docSlug}/form?order=${orderData.public_order_no}" class="btn-close" style="color: #fcd34d; border-color: rgba(252, 211, 77, 0.4); font-weight: 600;">✏️ विवरण सम्पादन (Edit)</a>
      <a href="?order=${orderData.public_order_no}" class="btn-close" style="background: rgba(24, 169, 153, 0.25); color: #2dd4bf; border-color: rgba(24, 169, 153, 0.45); font-weight: 700;">👁️ mPDF ('I' View)</a>
      <a href="/checkout?order=${orderData.public_order_no}" class="btn-close">बन्द गर्नुहोस् (Close)</a>
    </div>
  </div>`;
}
