/**
 * Annual Compliance Suite Renderer — 4 Official Sheets:
 *  Sheet 1: दर्ता दरखास्त निवेदन (वार्षिक विवरण अभिलेख गरी पाऊँ)
 *  Sheet 2: संचालक समितिको बैठक
 *  Sheet 3: साधारण सभा (AGM)
 *  Sheet 4: कम्पनी ऐन, २०६३ को दफा ५१ अनुसारको विवरण
 */

import type { RendererContext } from '../types';
import { toNepaliAddress } from '../helpers';

interface MemberItem {
  index: number;
  name: string;
  designation: string;
  address?: string;
}

/**
 * Builds signature / applicant blocks:
 * - 1 member: strictly right side
 * - 2 members: grid with 1 left, 1 right
 * - 3+ members: grid with max 3 per line
 */
function buildSignaturesTable(members: MemberItem[], label: string = 'हस्ताक्षर'): string {
  if (members.length === 1) {
    return `
    <table style="width:100%; border:none; margin-top:14px; border-collapse:collapse;">
      <tr>
        <td style="width:70%; border:none;"></td>
        <td style="width:30%; text-align:center; vertical-align:top; border:none; padding:0;">
          <div style="font-weight:bold; font-size:13.5px; color:#0f172a;">${label}</div>
          <div style="line-height:18px; margin:2px 0 4px 0;">
            &nbsp;<br/>
            &nbsp;<br/>
            &nbsp;
          </div>
          <div style="margin-bottom:4px; color:#475569; letter-spacing:1px;">...................................................</div>
          <div style="font-weight:bold; font-size:14.5px; color:#0f172a;">${members[0].name}</div>
          <div style="font-size:12.5px; font-weight:600; color:#334155;">${members[0].designation}</div>
        </td>
      </tr>
    </table>`;
  }

  if (members.length === 2) {
    return `
    <table style="width:100%; border:none; margin-top:14px; border-collapse:collapse;">
      <tr>
        <td style="width:45%; text-align:center; vertical-align:top; border:none; padding:0;">
          <div style="font-weight:bold; font-size:13.5px; color:#0f172a;">${label}</div>
          <div style="line-height:18px; margin:2px 0 4px 0;">
            &nbsp;<br/>
            &nbsp;<br/>
            &nbsp;
          </div>
          <div style="margin-bottom:4px; color:#475569; letter-spacing:1px;">...................................................</div>
          <div style="font-weight:bold; font-size:14px; color:#0f172a;">${members[0].name}</div>
          <div style="font-size:12px; font-weight:600; color:#334155;">${members[0].designation}</div>
        </td>
        <td style="width:10%; border:none;"></td>
        <td style="width:45%; text-align:center; vertical-align:top; border:none; padding:0;">
          <div style="font-weight:bold; font-size:13.5px; color:#0f172a;">${label}</div>
          <div style="line-height:18px; margin:2px 0 4px 0;">
            &nbsp;<br/>
            &nbsp;<br/>
            &nbsp;
          </div>
          <div style="margin-bottom:4px; color:#475569; letter-spacing:1px;">...................................................</div>
          <div style="font-weight:bold; font-size:14px; color:#0f172a;">${members[1].name}</div>
          <div style="font-size:12px; font-weight:600; color:#334155;">${members[1].designation}</div>
        </td>
      </tr>
    </table>`;
  }

  // 3 or more members: max 3 per row
  let rowsHtml = '';
  for (let r = 0; r < members.length; r += 3) {
    const slice = members.slice(r, r + 3);
    rowsHtml += `<tr>`;
    slice.forEach((m) => {
      rowsHtml += `
        <td style="width:33.33%; text-align:center; vertical-align:top; border:none; padding:6px 4px;">
          <div style="font-weight:bold; font-size:13px; color:#0f172a;">${label}</div>
          <div style="line-height:16px; margin:2px 0 4px 0;">
            &nbsp;<br/>
            &nbsp;<br/>
            &nbsp;
          </div>
          <div style="margin-bottom:4px; color:#475569; letter-spacing:1px;">................................</div>
          <div style="font-weight:bold; font-size:13.5px; color:#0f172a;">${m.name}</div>
          <div style="font-size:11.5px; font-weight:600; color:#334155;">${m.designation}</div>
        </td>`;
    });
    for (let emptyIdx = slice.length; emptyIdx < 3; emptyIdx++) {
      rowsHtml += `<td style="width:33.33%; border:none;"></td>`;
    }
    rowsHtml += `</tr>`;
  }

  return `
  <table style="width:100%; border:none; margin-top:14px; border-collapse:collapse;">
    ${rowsHtml}
  </table>`;
}

export function renderAnnualComplianceSuite(ctx: RendererContext): string {
  const { orderData, formData, orderDate } = ctx;
  const f = formData;

  const compNp = f['company.name_np'] || '.................... (प्रा. लि.)';
  const regNo = f['company.reg_no'] || '............';
  const rawRegAddr = f['company.registered_address_np'] || f['company.registered_address'] || '';
  const regAddr = f['company.registered_address_np'] || (rawRegAddr ? toNepaliAddress(rawRegAddr) : '....................');
  const fiscalYear = f['fiscal_year'] || '२०८१/०८२';
  const nextFiscalYear = f['next_fiscal_year'] || '२०८२/०८३';
  const appDate = f['application_date'] || orderDate || '२०८२। १२।१५';

  const bodDate = f['bod_meeting.date'] || '२०८२।०९।१३';
  const bodTime = f['bod_meeting.time'] || 'दिनको ११:००';

  const agmDate = f['agm_meeting.date'] || '२०८२।१२।०५';
  const agmTime = f['agm_meeting.time'] || 'दिनको ११:००';
  const agmVenue = f['agm_meeting.venue'] || 'कम्पनीकै रजिष्टर्ड कार्यालय';
  const auditorName = f['auditor.name_or_firm'] || '.................... एण्ड एसोसिएटस्';

  const capAuth = f['capital.authorized'] || '२५,००,०००';
  const capTotalShares = f['capital.total_shares'] || '२५,०००';
  const capIss = f['capital.issued'] || '२५,००,०००';
  const capIssShares = f['capital.issued_shares'] || '२५,०००';
  const capPaid = f['capital.paid_up'] || '२५,००,०००';
  const shareRate = f['capital.share_rate'] || '१००';

  const unpaidAmount = f['company.unpaid_share_amount'] || 'छैन';
  const brokerageFee = f['company.brokerage_fee'] || 'छैन';
  const forfeitedShares = f['company.forfeited_shares'] || 'छैन ।';
  const loansGuarantees = f['company.loans_guarantees'] || 'छैन ।';
  const investments = f['company.investments'] || 'छैन';

  // 1. Extract structured members (supports member_1..8, shareholder_1..8, director)
  const members: MemberItem[] = [];
  for (let i = 1; i <= 8; i++) {
    const mName =
      f[`member_${i}.name`] ||
      f[`member_${i}.full_name`] ||
      f[`shareholder_${i}.full_name`] ||
      f[`shareholder_${i}.name`] ||
      (i === 1 ? f['director.full_name'] : '');

    if (mName && mName.trim()) {
      let mDesig =
        f[`member_${i}.designation`] ||
        f[`member_${i}.post`] ||
        (i === 1 ? f['director.designation'] : '');

      if (!mDesig || !mDesig.trim()) {
        mDesig = i === 1 ? 'सञ्चालक अध्यक्ष' : 'सञ्चालक';
      }

      const rawAddr =
        f[`member_${i}.address_np`] ||
        f[`member_${i}.address`] ||
        (i === 1 ? (f['director.address_np'] || f['shareholder_1.address_np'] || f['director.address'] || f['shareholder_1.address']) : (f[`shareholder_${i}.address_np`] || f[`shareholder_${i}.address`])) ||
        '';

      const mAddr =
        f[`member_${i}.address_np`] ||
        (i === 1 ? (f['director.address_np'] || f['shareholder_1.address_np']) : f[`shareholder_${i}.address_np`]) ||
        (rawAddr ? toNepaliAddress(rawAddr) : '');

      members.push({
        index: i,
        name: mName.trim().replace(/^श्री\s*/, ''),
        designation: mDesig.trim(),
        address: mAddr ? mAddr.trim() : undefined,
      });
    }
  }

  // Fallback if no members gathered
  if (members.length === 0) {
    const dName = (f['director.full_name'] || '....................').trim().replace(/^श्री\s*/, '');
    const dDesig = (f['director.designation'] || 'संचालक अध्यक्ष').trim();
    members.push({
      index: 1,
      name: dName,
      designation: dDesig,
    });
  }

  const chairMember =
    members.find(
      (m) =>
        (m.designation || '').includes('अध्यक्ष') ||
        (m.designation || '').includes('प्रबन्ध')
    ) || members[0];
  const chairName = chairMember.name;
  const chairDesig = chairMember.designation;

  // Attendance HTML for BOD
  const bodAttendanceHtml = members
    .map(
      (m, idx) =>
        `<div>${['१', '२', '३', '४', '५', '६', '७', '८'][idx] || idx + 1}&nbsp;&nbsp;&nbsp;&nbsp;श्री ${m.name}&nbsp;&nbsp;&nbsp;&nbsp;${m.designation}</div>`
    )
    .join('');

  // Attendance HTML for AGM
  const agmAttendanceHtml = members
    .map(
      (m, idx) =>
        `<div>${['१', '२', '३', '४', '५', '६', '७', '८'][idx] || idx + 1}&nbsp;&nbsp;&nbsp;&nbsp;श्री ${m.name}&nbsp;&nbsp;&nbsp;&nbsp;${m.designation}</div>`
    )
    .join('');

  // Sunchalak list for Dafa 51
  const dafa51DirectorsHtml = members
    .map((m, idx) => {
      const num = ['१', '२', '३', '४', '५', '६', '७', '८'][idx] || idx + 1;
      const addrSuffix = m.address ? ` (${m.address})` : '';
      return `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${num}&nbsp;&nbsp;&nbsp;&nbsp;श्री ${m.name}&nbsp;&nbsp;&nbsp;&nbsp;${m.designation}${addrSuffix}`;
    })
    .join('<br/>\n');

  // Signatures HTML
  const bodSigsHtml = buildSignaturesTable(members, 'हस्ताक्षर');
  const agmSigsHtml = buildSignaturesTable(members, 'हस्ताक्षर');
  const dafa51SigsHtml = buildSignaturesTable(members, 'निवेदक');

  // 2. Proposals & Decisions for BOD Meeting
  const rawBodProposals = (f['bod_meeting.proposals'] || f['meeting.proposal'] || '').trim();
  const bodProposalsHtml = rawBodProposals
    ? rawBodProposals
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<div>${l}</div>`)
        .join('')
    : `१.&nbsp;&nbsp;&nbsp;&nbsp;वार्षिक साधारण सभा बोलाउने सम्बन्धमा ।<br/>२.&nbsp;&nbsp;&nbsp;&nbsp;विविध`;

  const rawBodDecisions = (f['bod_meeting.decisions'] || f['meeting.decisions'] || '').trim();
  const bodDecisionsHtml = rawBodDecisions
    ? rawBodDecisions
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<div style="margin-bottom:8px;">${l}</div>`)
        .join('')
    : `
      <div style="margin-bottom:8px;">
        १.&nbsp;&nbsp;&nbsp;&nbsp;प्रस्ताव नं. १ उपर छलफल हुँदा कम्पनी स्वीकृत नियमावलीको नियम बमोजिम कम्पनीको वार्षिक साधारण सभा निम्न मिति, समय र स्थानमा गर्ने निर्णय सर्वसम्मतीले पारित गरियो ।
      </div>
      <div style="padding-left:16px; margin-bottom:8px; line-height:1.75;">
        मिति: ${agmDate}<br/>
        समय: ${agmTime} बजे<br/>
        स्थान: ${agmVenue}
      </div>
      <div>
        २.&nbsp;&nbsp;&nbsp;&nbsp;विविध प्रस्ताव उपर छलफल गर्नुपर्ने अन्य विषय बाँकी नरहेकोले संचालकको अनुमतीले आजको बैठक समाप्त गरियो ।
      </div>`;

  // 3. Proposals & Decisions for AGM Meeting
  const rawAgmProposals = (f['agm_meeting.proposals'] || '').trim();
  const agmProposalsHtml = rawAgmProposals
    ? rawAgmProposals
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<div>${l}</div>`)
        .join('')
    : `
      १.&nbsp;&nbsp;&nbsp;&nbsp;आ.व. ${fiscalYear} सम्मको आषाढ मसान्तसम्मको प्रगति विवरण ।<br/>
      २.&nbsp;&nbsp;&nbsp;&nbsp;आ.व. ${fiscalYear} को लेखा परिक्षणको सम्बन्धमा ।<br/>
      ३.&nbsp;&nbsp;&nbsp;&nbsp;आगामी आ.व. ${nextFiscalYear} को लेखापरिक्षकको नियुक्ति र पारिश्रमिक सम्बन्धमा ।<br/>
      ४.&nbsp;&nbsp;&nbsp;&nbsp;विविध ।`;

  const rawAgmDecisions = (f['agm_meeting.decisions'] || '').trim();
  const agmDecisionsHtml = rawAgmDecisions
    ? rawAgmDecisions
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<div style="margin-bottom:6px;">${l}</div>`)
        .join('')
    : `
      <div style="margin-bottom:6px;">
        १.&nbsp;&nbsp;&nbsp;&nbsp;प्रस्ताव नं. १ उपर बैठकमा छलफल हुँदा कम्पनीको संचालकले कम्पनीको आ.व. ${fiscalYear} सम्मका प्रगति विवरण प्रस्तुत हुँदा सो विवरणलाई सभाले पारित गरियो ।
      </div>
      <div style="margin-bottom:6px;">
        २.&nbsp;&nbsp;&nbsp;&nbsp;प्रस्ताव नं. २ उपर सभामा छलफल हुँदा आ.व. ${fiscalYear} को कम्पनीको हिसाब किताब सहितको लेखा परिक्षण प्रतिवेदन कम्पनीको लेखा परिक्षक श्री ${auditorName} ले तयार गर्नु भएको लेखा परिक्षण प्रतिवेदनलाई यस सभाले पारित गरियो ।
      </div>
      <div style="margin-bottom:6px;">
        ३.&nbsp;&nbsp;&nbsp;&nbsp;प्रस्ताव नं. ३ उपर सभामा छलफल हुँदा कम्पनी ऐन बमोजिम आगामी आ.व. ${nextFiscalYear} को लागि कम्पनीको लेखा परिक्षक गर्न रजिष्टर्ड लेखा परिक्षक श्री ${auditorName} लाई नियुक्ति गर्ने र निजको पारिश्रमिक आपसी सहमतीबाट दिने निर्णय सभाले पारित गरियो ।
      </div>
      <div>
        ४.&nbsp;&nbsp;&nbsp;&nbsp;विविध प्रस्ताव उपर छलफल गर्नुपर्ने अन्य विषय बाँकी नरहेकोले संचालकको अनुमतीले आजको बैठक समाप्त गरियो ।
      </div>`;

  return `
  <!-- SHEET 1: दर्ता दरखास्त निवेदन (वार्षिक विवरण अभिलेख गरी पाऊँ) -->
  <div class="a4-sheet" id="sheet-app" style="position:relative; background:#fff; box-sizing:border-box; margin:0; padding:0;">
    <div style="text-align:right; font-size:13px; font-weight:600; margin-bottom:4px;">
      प्रा.लि.नं. ${regNo}
    </div>

    <div style="text-align:center; margin-bottom:8px;">
      <div style="font-size:22px; font-weight:bold; color:#0f172a; line-height:1.3;">
        ${compNp}
      </div>
      <div style="font-size:12.5px; font-weight:500; color:#334155; margin-top:3px;">
        ${regAddr}
      </div>
      <div style="border-bottom:1px solid #475569; margin:8px 0 14px;"></div>
    </div>

    <div style="text-align:right; font-size:13.5px; font-weight:600; margin-bottom:14px;">
      मिति: ${appDate}
    </div>

    <div style="text-align:left; font-size:13.5px; line-height:1.6; margin-bottom:16px; font-weight:500;">
      श्रीमान् रजिष्ट्रार ज्यू<br/>
      कम्पनी रजिष्ट्रारको कार्यालय<br/>
      त्रिपुरेश्वर, काठमाडौँ ।
    </div>

    <div style="text-align:center; font-size:15px; font-weight:bold; margin-bottom:16px;">
      विषय:- <span style="text-decoration:underline;">वार्षिक विवरण अभिलेख गरी पाऊँ ।</span>
    </div>

    <div style="font-size:13.5px; line-height:1.85; text-align:justify; margin-bottom:16px;">
      महोदय,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;उपरोक्त सम्बन्धमा यस कम्पनीको आ.व. ${fiscalYear} को वार्षिक विवरण तथा लेखा परीक्षण प्रतिवेदन अभिलेख गर्नको लागि आवश्यक कागजातहरु यसै साथ संलग्न राखी पेश गरिएको व्यहोरा सादर अनुरोध छ । सो अनुसार अभिलेख गरी पाउँ ।
    </div>

    <div style="font-size:13px; line-height:1.75; margin-bottom:24px;">
      <div style="font-weight:bold; margin-bottom:4px;">संलग्न कागजातहरु:</div>
      <div style="padding-left:10px;">
        १.&nbsp;&nbsp;&nbsp;&nbsp;संचालक समितिको बैठक<br/>
        २.&nbsp;&nbsp;&nbsp;&nbsp;आ.व. ${fiscalYear} को लेखापरिक्षक प्रतिवेदन<br/>
        ३.&nbsp;&nbsp;&nbsp;&nbsp;आ.व. ${fiscalYear} का वार्षिक साधारण सभा<br/>
        ४.&nbsp;&nbsp;&nbsp;&nbsp;दफा ५१ को बिबरण
      </div>
    </div>

    <table style="width:100%; border:none; margin-top:16px; border-collapse:collapse;">
      <tr>
        <td style="width:70%; border:none;"></td>
        <td style="width:30%; text-align:center; vertical-align:top; border:none; padding:0;">
          <div style="font-weight:bold; font-size:13.5px; color:#0f172a;">निवेदक</div>
          <div style="line-height:18px; margin:2px 0 4px 0;">
            &nbsp;<br/>
            &nbsp;<br/>
            &nbsp;
          </div>
          <div style="margin-bottom:4px; color:#475569; letter-spacing:1px;">...................................................</div>
          <div style="font-weight:bold; font-size:14.5px; color:#0f172a;">${chairName}</div>
          <div style="font-size:12.5px; font-weight:600; color:#334155;">${chairDesig}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- SHEET 2: संचालक समितिको बैठक (Image 3) -->
  <div class="a4-sheet" id="sheet-bod" style="page-break-before:always; position:relative; background:#fff; box-sizing:border-box; margin:0; padding:0;">
    <div style="text-align:center; margin-bottom:16px;">
      <div style="font-size:20px; font-weight:bold; color:#0f172a;">
        ${compNp}
      </div>
      <div style="font-size:16px; font-weight:bold; margin-top:10px; text-decoration:underline;">
        संचालक समितिको बैठक
      </div>
    </div>

    <div style="font-size:13.5px; line-height:1.85; text-align:justify; margin-bottom:12px;">
      आज मिति: ${bodDate} गते दिनको ${bodTime} बजे यस प्रा.लि.को ${chairDesig} श्री ${chairName}को अध्यक्षतामा कम्पनीकै रजिष्टर्ड कार्यालयमा संचालक समितिको बैठक बसी निम्न प्रस्ताव अनुसार निम्न निर्णय गरियो ।
    </div>

    <div style="font-size:13px; line-height:1.75; margin-bottom:12px;">
      <div style="font-weight:bold; margin-bottom:2px;">उपस्थीती</div>
      <div style="padding-left:8px; line-height:1.75;">
        ${bodAttendanceHtml}
      </div>
    </div>

    <div style="font-size:13px; line-height:1.75; margin-bottom:12px;">
      <div style="font-weight:bold; margin-bottom:2px; text-decoration:underline;">प्रस्तावहरु</div>
      <div style="padding-left:8px;">
        ${bodProposalsHtml}
      </div>
    </div>

    <div style="font-size:13px; line-height:1.8; text-align:justify; margin-bottom:16px;">
      <div style="font-weight:bold; margin-bottom:4px; text-decoration:underline;">निर्णयहरु</div>
      ${bodDecisionsHtml}
    </div>

    ${bodSigsHtml}
  </div>

  <!-- SHEET 3: साधारण सभा (AGM - Image 4) -->
  <div class="a4-sheet" id="sheet-agm" style="page-break-before:always; position:relative; background:#fff; box-sizing:border-box; margin:0; padding:0;">
    <div style="text-align:center; margin-bottom:14px;">
      <div style="font-size:20px; font-weight:bold; color:#0f172a;">
        ${compNp}
      </div>
      <div style="font-size:16px; font-weight:bold; margin-top:10px; text-decoration:underline;">
        साधारण सभा
      </div>
    </div>

    <div style="font-size:13px; line-height:1.8; text-align:justify; margin-bottom:10px;">
      आज मिति: ${agmDate} गते दिनको ${agmTime} बजे यस प्रा.लि.को ${chairDesig} श्री ${chairName}को अध्यक्षतामा कम्पनीकै रजिष्टर्ड कार्यालयमा साधारण सभा बसी निम्न प्रस्ताव अनुसार निम्न निर्णय गरियो ।
    </div>

    <div style="font-size:12.5px; line-height:1.7; margin-bottom:10px;">
      <div style="font-weight:bold; margin-bottom:2px;">उपस्थीती</div>
      <div style="padding-left:8px; line-height:1.7;">
        ${agmAttendanceHtml}
        <div style="margin-top:3px;">उपस्थिति प्रतिशत:- सतप्रतिशत</div>
        <div style="margin-top:2px;"><span style="text-decoration:underline; font-weight:600;">सभाको वैधानिकता:-</span> कम्पनी ऐन २०६३ बमोजिम स्वीकृत नियमावली बमोजिम शेयरको प्रतिनिधित्व भएको र नियम बमोजिमको सूचना समेत शेयरधनीहरुलाई गराइएको देखिंदा सभाको वैधानिकता पूरा भएको हुँदा कम्पनी ऐन २०६३ बमोजिम सभालाई वैधानिक घोषणा गरी सभाको कारवाही अगाडी बढाइयो ।</div>
      </div>
    </div>

    <div style="font-size:12.5px; line-height:1.7; margin-bottom:10px;">
      <div style="font-weight:bold; margin-bottom:2px; text-decoration:underline;">छलफलका प्रस्तावहरु:</div>
      <div style="padding-left:8px;">
        ${agmProposalsHtml}
      </div>
    </div>

    <div style="font-size:12.5px; line-height:1.75; text-align:justify; margin-bottom:14px;">
      <div style="font-weight:bold; margin-bottom:3px; text-decoration:underline;">निर्णयहरु</div>
      ${agmDecisionsHtml}
    </div>

    ${agmSigsHtml}
  </div>

  <!-- SHEET 4: कम्पनी ऐन, २०६३ को दफा ५१ अनुसारको विवरण (Image 5) -->
  <div class="a4-sheet" id="sheet-dafa51" style="page-break-before:always; position:relative; background:#fff; box-sizing:border-box; margin:0; padding:0;">
    <div style="text-align:center; margin-bottom:12px;">
      <div style="font-size:18px; font-weight:bold; color:#0f172a; line-height:1.4;">
        कम्पनी ऐन, २०६३ को दफा ५१ अनुसारको<br/>विवरण
      </div>
      <div style="font-size:16px; font-weight:bold; color:#0f172a; margin-top:6px;">
        यस ${compNp}
      </div>
    </div>

    <div style="font-size:13px; font-weight:500; margin-bottom:10px;">
      कम्पनी ऐन, २०६३ को दफा ५१ अनुसारको लगत यस अनुसार पेश गरिएको छ ।
    </div>

    <div style="font-size:13px; line-height:1.75; text-align:justify;">
      <div style="margin-bottom:5px;">
        <b>(क)</b>&nbsp;&nbsp;&nbsp;&nbsp;कम्पनीको अधिकृत पूँजी र शेयरसंख्या: कम्पनीको अधिकृत पूँजी रु ${capAuth}/- रहेको छ र शेयरको संख्या ${capTotalShares} थान रहेको छ ।
      </div>

      <div style="margin-bottom:5px;">
        <b>(ख)</b>&nbsp;&nbsp;&nbsp;&nbsp;कम्पनी जारी पूँजी र शेयरको संख्या:- कम्पनीको जारी पूँजी रु ${capIss}/- रहेको छ र शेयरको संख्या ${capIssShares} थान रहेको छ ।
      </div>

      <div style="margin-bottom:5px;">
        <b>(ग)</b>&nbsp;&nbsp;&nbsp;&nbsp;कम्पनीको चुक्ता पूँजी:- कम्पनीको चुक्ता पूँजी रु ${capPaid}/- रहेको छ ।
      </div>

      <div style="margin-bottom:5px;">
        <b>(घ)</b>&nbsp;&nbsp;&nbsp;&nbsp;शेयर पिच्छे माग भएको रकम:- शेयर पिच्छे माग भएको रकम रु ${shareRate}/- रहेको छ ।
      </div>

      <div style="margin-bottom:5px;">
        <b>(ङ)</b>&nbsp;&nbsp;&nbsp;&nbsp;किस्ता असुल भएको जम्मा रकम:- माग अनुसार पुरै
      </div>

      <div style="margin-bottom:5px;">
        <b>(च)</b>&nbsp;&nbsp;&nbsp;&nbsp;असुल हुन बाँकी रहेको जम्मा रकम:- ${unpaidAmount}
      </div>

      <div style="margin-bottom:5px;">
        <b>(छ)</b>&nbsp;&nbsp;&nbsp;&nbsp;शेयर वा डिबेञ्चरमा दलाली दस्तुर वापत दिएको जम्मा रकम:- ${brokerageFee}
      </div>

      <div style="margin-bottom:5px;">
        <b>(ज)</b>&nbsp;&nbsp;&nbsp;&nbsp;कुनै शेयर जफत गरिएकोमा त्यस्तो शेयरको जम्मा संख्या, जफत भएको कारण र मिति: ${forfeitedShares}
      </div>

      <div style="margin-bottom:5px;">
        <b>(झ)</b>&nbsp;&nbsp;&nbsp;&nbsp;बैंक वित्तिय संस्था वा अन्य कुनै व्यक्तिबाट ऋण वा कम्पनीले दिएको जमानत: ${loansGuarantees}<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;संलग्न वासलात बमोजिम ।<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;१ अन्य कम्पनी वा शेयर डिभेन्चरमा लगानी गरेको भए त्यस्तो कम्पनीको नाम र दर्ता नं. समेत । ${investments}
      </div>

      <div style="margin-bottom:8px;">
        <b>(ञ)</b>&nbsp;&nbsp;&nbsp;&nbsp;बहालवाला सञ्चालकको नाम र ठेगाना:<br/>
          ${dafa51DirectorsHtml}
      </div>
    </div>

    ${dafa51SigsHtml}
  </div>
  `;
}
