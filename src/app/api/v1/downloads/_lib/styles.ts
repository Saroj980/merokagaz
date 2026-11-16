export function getPdfDocumentStyles(isLegalDeed: boolean): string {
  return `
    * { box-sizing: border-box; }
    body {
      background-color: transparent !important;
      font-family: 'kalimati', serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 13.5px;
      line-height: 1.5;
      letter-spacing: 0.3px;
    }
    p {
      margin-top: 0 !important;
      margin-bottom: 5px !important;
      line-height: 1.5 !important;
      letter-spacing: 0.3px !important;
    }
    .en, [lang="en"] { font-family: 'Times New Roman', times, serif !important; }
    .toolbar, .no-print, .footer-security { display: none !important; }
    .a4-sheet {
      background: transparent !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      position: relative;
      border: 0 none transparent !important;
      outline: 0 none transparent !important;
    }
    #sheet-bod, #sheet-agm, #sheet-dafa51, #sheet-moa, #sheet-aoa, #sheet-res {
      page-break-before: always !important;
    }
    .doc-content { position: relative; }
    .letterhead {
      text-align: center;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .schedule-header {
      text-align: center;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .nepal-emblem-text {
      font-size: 13.5px;
      font-weight: bold;
      color: #b91c1c;
      margin-bottom: 3px;
    }
    .letterhead-details {
      font-size: 13px;
      font-weight: bold;
      color: #1e293b;
      white-space: pre-line;
      line-height: 1.35;
    }
    .ref-line {
      font-size: 11px;
      color: #64748b;
      padding-bottom: 6px;
      border-bottom: 1px dashed #cbd5e1;
      margin-bottom: 10px;
      width: 100%;
    }
    .office-block {
      font-size: 13.5px;
      font-weight: bold;
      color: #0f172a;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .subject-block {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      color: #0f172a;
      text-decoration: underline;
      margin: 8px 0 10px 0;
    }
    .salutation {
      font-size: 13.5px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .body-content {
      font-size: 13.5px;
      color: #334155;
      line-height: 1.5;
      text-align: justify;
    }
    .declaration-box {
      margin-top: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      font-size: 12px;
      color: #475569;
    }
    .applicant-box {
      font-size: 13px;
      line-height: 1.5;
      color: #1e293b;
    }
    .sign-section {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      width: 100%;
    }
    .footer-security {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
      font-size: 10px;
      color: #94a3b8;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    table.data-table th, table.data-table td, table.bordered th, table.bordered td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
    }
    table.layout-table, table.layout-table tr, table.layout-table th, table.layout-table td {
      border: 0 none transparent !important;
      outline: none !important;
      padding: 0 !important;
    }
  `;
}

export function getDocumentStyles(topMargin: number, bottomMargin: number, isLegalDeed: boolean): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0f172a;
      font-family: 'Outfit', 'Tiro Devanagari Sanskrit', serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    /* Floating Toolbar (Hidden on print) */
    .toolbar {
      position: sticky;
      top: 15px;
      z-index: 100;
      width: 100%;
      max-width: 210mm;
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
    }
    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #f8fafc;
      font-size: 13px;
      font-weight: 600;
    }
    .badge-order {
      background: rgba(24, 169, 153, 0.2);
      color: #2dd4bf;
      border: 1px solid rgba(24, 169, 153, 0.4);
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 11px;
    }
    .btn-print {
      background: linear-gradient(135deg, #18A999 0%, #148C7E 100%);
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(24, 169, 153, 0.35);
      transition: all 0.2s ease;
    }
    .btn-print:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(24, 169, 153, 0.45);
    }
    .btn-close {
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-close:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* A4 Paper Sheet */
    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: ${topMargin}mm 20mm ${bottomMargin}mm 20mm;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      border: ${isLegalDeed ? '4px double #1e293b' : 'none'};
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #1e293b;
      line-height: 1.6;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 54px;
      font-weight: 900;
      color: rgba(18, 59, 93, 0.04);
      pointer-events: none;
      user-select: none;
      letter-spacing: 12px;
      white-space: nowrap;
      z-index: 1;
    }

    .doc-content {
      position: relative;
      z-index: 2;
    }

    .letterhead {
      text-align: center;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .schedule-header {
      text-align: center;
      padding-bottom: 8px;
      margin-bottom: 18px;
    }
    .nepal-emblem-text {
      font-size: 15px;
      font-weight: 800;
      color: #b91c1c;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .letterhead-details {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      white-space: pre-line;
      line-height: 1.4;
    }
    .salutation {
      font-size: 14px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .applicant-box {
      font-size: 13px;
      line-height: 1.65;
      color: #1e293b;
    }
    table.layout-table, table.layout-table th, table.layout-table td {
      border: none !important;
      padding: 0 !important;
    }

    .ref-line {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
      padding-bottom: 10px;
      border-bottom: 1px dashed #cbd5e1;
      margin-bottom: 16px;
    }

    .office-block {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      white-space: pre-line;
      margin-bottom: 14px;
      line-height: 1.4;
    }

    .subject-block {
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-decoration: underline;
      text-underline-offset: 4px;
      margin: 14px 0 18px 0;
    }

    .body-content {
      font-size: 13px;
      color: #334155;
      line-height: 1.8;
      text-align: justify;
    }

    .declaration-box {
      margin-top: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      color: #475569;
      font-style: italic;
    }

    .sign-section {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }
    .sig-applicant { width: 200px; text-align: left; }
    .sig-line {
      border-bottom: 1px dotted #94a3b8;
      height: 35px;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-end;
      font-weight: bold;
      color: #123B5D;
      font-size: 13px;
    }
    .sig-label { font-size: 11px; color: #64748b; }

    .seal-box {
      text-align: center;
      border: 2px solid #b91c1c;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #b91c1c;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      opacity: 0.85;
      transform: rotate(-10deg);
    }

    .footer-security {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
      font-family: monospace;
    }

    /* Print */
    @media print {
      body { background: transparent !important; padding: 0 !important; margin: 0 !important; }
      .no-print { display: none !important; }
      .a4-sheet {
        background: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        min-height: auto !important;
        padding: ${topMargin}mm 15mm ${bottomMargin}mm 15mm !important;
        margin: 0 auto !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .a4-sheet:last-of-type {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      @page { size: A4; margin: 0; }
    }
  `;
}

export const FONT_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap" rel="stylesheet" />
`;
