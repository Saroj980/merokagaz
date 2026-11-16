/**
 * Mero Kagaz — Document Download Route
 *
 * Responsibilities:
 *  1. Fetch order & document layout from Laravel API
 *  2. Resolve layout flags (header/footer/watermark/margins)
 *  3. Delegate HTML body rendering to the right template
 *  4. Wrap in shared <html> shell (fonts, styles, toolbar, print script)
 *
 * Template files live in _lib/templates/:
 *   company-suite.ts  — 4-page OCR company registration package
 *   aoa-full.ts       — Anusuchi 3 single-shareholder AOA
 *   generic.ts        — fallback for any other document
 */

import { NextRequest } from 'next/server';

import { getDocumentStyles, getPdfDocumentStyles, FONT_LINK } from '../_lib/styles';
import {
  makePlaceholderReplacer,
  resolveLayoutFlags,
  formatOrderDate,
  missingTokenPage,
  orderNotFoundPage,
} from '../_lib/helpers';
import { renderToolbar } from '../_lib/toolbar';
import type { RendererContext } from '../_lib/types';

import { renderCompanySuite } from '../_lib/templates/company-suite';
import { renderAnnualComplianceSuite } from '../_lib/templates/annual-compliance-suite';
import { renderAoaFull }      from '../_lib/templates/aoa-full';
import { renderMoaFull }      from '../_lib/templates/moa-full';
import { renderMinutesResolution } from '../_lib/templates/minutes-resolution';
import { renderGenericDoc }   from '../_lib/templates/generic';

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const orderNo = searchParams.get('order') || token || '';

  if (!orderNo) return missingTokenPage();

  // 1. Fetch Order
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  let orderData: any = null;

  try {
    const res = await fetch(`${apiBase}/api/v1/orders/${encodeURIComponent(orderNo)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) orderData = json.data;
    }
  } catch (err) {
    console.error('[download] Failed to fetch order:', err);
  }

  if (!orderData) return orderNotFoundPage();

  // 2. Fetch Document schema & layout
  const docSlug = orderData.document?.slug || '';
  let docLayout: any = orderData.document_version?.template?.doc_layout || null;
  let docMeta: any   = null;

  try {
    const [docRes, schemaRes] = await Promise.all([
      fetch(`${apiBase}/api/v1/documents/${encodeURIComponent(docSlug)}`, { cache: 'no-store' }),
      docLayout ? Promise.resolve(null) : fetch(`${apiBase}/api/v1/documents/${encodeURIComponent(docSlug)}/schema`, { cache: 'no-store' }),
    ]);
    if (docRes.ok)    docMeta   = (await docRes.json()).data;
    if (!docLayout && schemaRes && schemaRes.ok) docLayout = (await schemaRes.json()).data?.form_schema?.doc_layout;
  } catch (err) {
    console.warn('[download] Failed to fetch doc layout:', err);
  }

  // 3. Build shared context
  const formData = orderData.form_data || {};
  const flags    = resolveLayoutFlags(docLayout);

  // Paid orders / fulfilled document downloads MUST NOT have watermarks
  const isPaid = orderData.payment_status === 'paid' || Boolean(orderData.download_ready);
  const isExplicitPreview = searchParams.get('preview') === '1';
  if (isPaid || !isExplicitPreview) {
    flags.showWatermark = false;
  }
  const ctx: RendererContext = {
    orderData,
    docSlug,
    docMeta,
    docLayout,
    formData,
    orderDate: formatOrderDate(orderData.created_at),
    replacePlaceholders: makePlaceholderReplacer(formData),
  };

  const docTitleNp = orderData.document?.name_np || docMeta?.name_np || 'आधिकारिक कागजात';
  const docTitleEn = orderData.document?.name    || docMeta?.name    || 'Official Document';

  // 4. Pick the right template renderer
  let bodyHtml: string;
  if (docSlug === 'company-registration-suite') {
    bodyHtml = renderCompanySuite(ctx);
  } else if (
    docSlug === 'annual-compliance-suite' ||
    docSlug === 'agm-section51-annual-return'
  ) {
    bodyHtml = renderAnnualComplianceSuite(ctx);
  } else if (
    docSlug === 'pvt-ltd-company-aoa-full' ||
    docSlug === 'pvt-ltd-company-aoa' ||
    docSlug === 'ocr-annex-15-public-ltd-aoa'
  ) {
    bodyHtml = renderAoaFull(ctx);
  } else if (
    docSlug === 'pvt-ltd-company-moa-full' ||
    docSlug === 'pvt-ltd-company-moa' ||
    docSlug === 'ocr-annex-9-single-shareholder-moa' ||
    docSlug === 'ocr-annex-10-multi-shareholder-moa' ||
    docSlug === 'ocr-annex-11-public-ltd-moa'
  ) {
    bodyHtml = renderMoaFull(ctx);
  } else if (
    docSlug === 'board-resolution-minutes' ||
    docSlug === 'pvt-ltd-promoters-resolution' ||
    docSlug.includes('resolution') ||
    docSlug.includes('minute')
  ) {
    bodyHtml = renderMinutesResolution(ctx);
  } else {
    bodyHtml = renderGenericDoc(ctx, flags);
  }

  // 5. Default to mPDF 'I' view (Inline PDF Stream)
  const format = searchParams.get('format') || 'pdf';

  if (format !== 'html') {
    const pdfHtml = `<!DOCTYPE html>
<html lang="ne">
<head>
  <meta charset="utf-8" />
  <style>
    ${getPdfDocumentStyles(flags.isLegalDeed)}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

    try {
      const pdfRes = await fetch(`${apiBase}/api/v1/pdf/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: pdfHtml,
          filename: `${docSlug}_${orderData.public_order_no}.pdf`,
          margin_top: flags.topMargin || 12,
          margin_bottom: flags.bottomMargin || 12,
          margin_left: 12,
          margin_right: 12,
          watermark: flags.showWatermark ? 'मेरो कागज' : undefined,
          show_watermark: flags.showWatermark,
          mode: 'I',
        }),
      });

      if (pdfRes.ok) {
        const pdfBuffer = await pdfRes.arrayBuffer();
        const safeFilename = `${docSlug}_${orderData.public_order_no}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
        return new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${safeFilename}"`,
            'Cache-Control': 'private, max-age=0, must-revalidate',
            'Pragma': 'public',
          },
        });
      }
      console.warn('[download] Backend mPDF render failed with status:', pdfRes.status);
    } catch (err) {
      console.error('[download] Failed to connect to backend mPDF service:', err);
    }
  }

  // 6. Fallback or explicit HTML preview (?format=html)
  const html = `<!DOCTYPE html>
<html lang="ne">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitleNp} — ${orderData.public_order_no} | Mero Kagaz</title>
  <meta name="description" content="${docTitleEn} — ${orderData.public_order_no}" />
  ${FONT_LINK}
  <style>${getDocumentStyles(flags.topMargin, flags.bottomMargin, flags.isLegalDeed)}</style>
</head>
<body>

  ${renderToolbar(ctx)}

  ${bodyHtml}

  <script>
    // Auto-print if ?auto=1 is in the URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('auto') === '1') {
      window.addEventListener('load', () => setTimeout(() => window.print(), 350));
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
