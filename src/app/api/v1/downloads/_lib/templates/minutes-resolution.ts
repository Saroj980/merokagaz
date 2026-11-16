/**
 * Meeting Minutes / Board & Promoters Resolution Template Renderer
 * कम्पनीको बैठकको निर्णय / माइन्युट (Minutes of Meeting)
 * 
 * Supports both:
 * 1. एकल सञ्चालक / शेयरधनी (Single Shareholder / Director)
 * 2. बहु-सञ्चालक / शेयरधनीहरू (Multiple Shareholders / Directors)
 * 
 * Includes: Place (स्थान), Date (मिति), Present Members with Designation (उपस्थित सदस्य र पद),
 * Proposals/Agendas (प्रस्ताव), Decisions (निर्णय), and Signatures (हस्ताक्षर).
 */

import type { RendererContext } from '../types';
import { getCurrentNepaliItiDate, toNepaliAddress } from '../helpers';

interface MemberItem {
  index: number;
  name: string;
  designation: string;
}

function toNepaliDigits(val: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(val).replace(/\d/g, (d) => nepaliDigits[Number(d)]);
}

export function renderMinutesResolution(ctx: RendererContext): string {
  const { orderData, formData, orderDate } = ctx;

  // 1. Company Name
  const compNp = formData['company.name_np'] || formData['company_name_np'] || 'कम्पनीको नाम';
  const compEn = formData['company.name_en'] || formData['company_name_en'] || '';
  const fullCompTitle = compEn ? `${compNp} (${compEn})` : compNp;

  // 2. Place & Date
  const defaultIti = getCurrentNepaliItiDate();
  const rawPlace = formData['meeting.venue']
                || formData['meeting.place']
                || formData['meeting_place']
                || formData['company.registered_address']
                || 'कम्पनीको कार्यालय';
  const place = rawPlace.trim() || 'कम्पनीको कार्यालय';

  const rawDate = formData['meeting.date']
               || formData['meeting_date']
               || `${defaultIti.yearNp}/${defaultIti.monthNp}/${defaultIti.dayNp}`;
  const meetingDate = toNepaliDigits(rawDate.trim());

  // 3. Extract Members & Designations
  const members: MemberItem[] = [];

  // Check structured fields: member_1 to member_10
  for (let i = 1; i <= 10; i++) {
    const mName = formData[`member_${i}.name`]
               || formData[`member_${i}.full_name`]
               || (i === 1 ? (formData['director.full_name'] || formData['shareholder_1.full_name'] || formData['meeting.chairperson'] || formData['applicant.full_name']) : (formData[`shareholder_${i}.full_name`]));
    
    if (mName && mName.trim()) {
      let mDesig = formData[`member_${i}.designation`]
                || formData[`member_${i}.post`]
                || (i === 1 ? (formData['director.designation'] || formData['meeting.chairperson_designation']) : '');

      if (!mDesig || !mDesig.trim()) {
        mDesig = i === 1 ? 'सञ्चालक / प्रोप्राइटर' : 'सञ्चालक';
      }

      members.push({
        index: i,
        name: mName.trim().replace(/^श्री\s*/, ''),
        designation: mDesig.trim(),
      });
    }
  }

  // If no members array gathered, fallback to single director/applicant
  if (members.length === 0) {
    const singleName = (formData['meeting.chairperson']
                    || formData['director.full_name']
                    || formData['shareholder_1.full_name']
                    || formData['applicant.full_name']
                    || 'सञ्चालक').trim().replace(/^श्री\s*/, '');
    const singleDesig = (formData['meeting.chairperson_designation']
                     || formData['director.designation']
                     || 'सञ्चालक / प्रोप्राइटर').trim();
    members.push({
      index: 1,
      name: singleName,
      designation: singleDesig,
    });
  }

  // Determine if Single Shareholder or Multiple Shareholders
  const rawType = (formData['meeting.type'] || formData['meeting_type'] || '').toLowerCase();
  const isExplicitSingle = rawType.includes('single') || rawType.includes('एकल');
  const isExplicitMulti  = rawType.includes('multi') || rawType.includes('multiple') || rawType.includes('बहु');

  const isSingle = isExplicitSingle ? true : (isExplicitMulti ? false : (members.length <= 1));

  // Chairperson
  const chairMember = members[0];
  const chairName = chairMember ? chairMember.name : 'सञ्चालक';

  // 4. Meeting Opening Paragraph
  let introHtml = '';
  if (isSingle) {
    introHtml = `आज मिति <b>${meetingDate}</b> गते <b>${compEn ? compEn : compNp}</b> का एकल सञ्चालक श्री <b>${chairName}</b> को अध्यक्षतामा कम्पनीको बैठक बसी निम्न विषयमा छलफल गरी आवश्यक निर्णय गरियो।`;
  } else {
    introHtml = `आज मिति <b>${meetingDate}</b> गते <b>${compEn ? compEn : compNp}</b> का अध्यक्ष श्री <b>${chairName}</b> को अध्यक्षतामा तथा निम्न सञ्चालक/शेयरधनीहरूको उपस्थितिमा कम्पनीको बैठक बसी निम्न विषयमा छलफल गरी आवश्यक निर्णय गरियो।`;
  }

  // 5. Present Members List (उपस्थित)
  // Check if raw custom attendance text is provided
  const rawAttendance = formData['meeting.attendance'] || formData['meeting_attendance'];
  let attendanceHtml = '';
  if (rawAttendance && rawAttendance.trim()) {
    const lines = rawAttendance.split('\n').map((l: string) => l.trim()).filter(Boolean);
    attendanceHtml = lines.map((l: string) => `<div>${l}</div>`).join('');
  } else {
    attendanceHtml = members.map((m) => `
      <div>${toNepaliDigits(m.index)}. श्री ${m.name} – ${m.designation}</div>
    `).join('');
  }

  // 6. Proposal / Objectives (प्रस्ताव)
  const rawProposal = formData['meeting.proposal']
                   || formData['meeting.objectives']
                   || formData['meeting.agendas']
                   || formData['meeting_proposal']
                   || '';

  let proposalHtml = '';
  if (rawProposal.trim()) {
    const lines = rawProposal.split('\n').map((l: string) => l.trim()).filter(Boolean);
    proposalHtml = lines.map((l: string) => `<p style="margin: 0 0 6px 0; text-align: justify; line-height: 1.6;">${l}</p>`).join('');
  } else {
    // Compliant default proposal
    proposalHtml = `
    <p style="margin: 0 0 6px 0; text-align: justify; line-height: 1.6;">
      कम्पनीको दैनिक कार्यसञ्चालन, बैंकिङ कारोबारलाई सुरक्षित, प्रभावकारी तथा डिजिटल माध्यमबाट सञ्चालन गर्न बैंक खाता सञ्चालन, आवश्यक अनलाइन प्रणाली (जस्तै: CorporatePay) सेवा सञ्चालन गर्ने, आधिकारिक प्रयोगकर्ताहरू नियुक्त गर्ने तथा आवश्यक बैंकिङ सेवाहरू प्रयोग गर्ने सम्बन्धमा।
    </p>`;
  }

  // 7. Decisions (निर्णय)
  const rawDecisions = formData['meeting.decisions']
                    || formData['meeting.decision']
                    || formData['meeting_decisions']
                    || '';

  let decisionsHtml = '';
  if (rawDecisions.trim()) {
    const lines = rawDecisions.split('\n').map((l: string) => l.trim()).filter(Boolean);
    decisionsHtml = lines.map((l: string) => {
      // Bold sub-headings or bullets
      if (l.startsWith('-') || l.startsWith('•')) {
        return `<p style="margin: 0 0 4px 16px; line-height: 1.6; text-align: justify;">${l}</p>`;
      }
      if (/^[०-९0-9]+\.\s+/.test(l)) {
        return `<p style="margin: 8px 0 4px 0; line-height: 1.6; text-align: justify; font-weight: 500;"><b>${l}</b></p>`;
      }
      return `<p style="margin: 0 0 8px 0; line-height: 1.6; text-align: justify;">${l}</p>`;
    }).join('');
  } else {
    // Compliant default decision based on corporate pay / bank operation format
    decisionsHtml = `
    <p style="margin: 0 0 8px 0; line-height: 1.6; text-align: justify;">
      प्रस्ताव उपर छलफल गर्दा कम्पनीको नाममा सञ्चालित बैंक खाताका लागि आवश्यक डिजिटल बैंकिङ तथा CorporatePay सेवा जडान तथा सञ्चालन गर्ने निर्णय सर्वसम्मत रूपमा गरियो।
    </p>
    <p style="margin: 0 0 8px 0; line-height: 1.6; text-align: justify;">
      साथै बैंकिङ प्रणालीमा आधिकारिक प्रयोगकर्ताको रूपमा देहाय बमोजिमका व्यक्तिहरूलाई भुक्तानी प्रारम्भ (Payment Initiation), भुक्तानी स्वीकृति (Payment Approval) तथा खाता व्यवस्थापनको सम्पूर्ण अधिकार प्रदान गर्ने निर्णय गरियो:
    </p>
    <div style="margin: 6px 0 10px 14px; line-height: 1.6;">
      <div><b>१. Transaction Initiator / सञ्चालक:</b> श्री ${chairName} (मोबाइल: ${formData['applicant.phone'] || formData['director.phone'] || '—'})</div>
    </div>
    <p style="margin: 0 0 8px 0; line-height: 1.6; text-align: justify;">
      साथै सेवा सञ्चालनका लागि आवश्यक आवेदन फाराम भर्ने, कागजात पेश गर्ने, सम्झौतामा हस्ताक्षर गर्ने तथा बैंकले माग गरेका सम्पूर्ण प्रक्रिया पूरा गर्ने अधिकार सञ्चालक श्री <b>${chairName}</b> लाई प्रदान गर्ने निर्णय गरियो। यस सम्बन्धमा कम्पनीको लेटरहेड, आधिकारिक छाप तथा आवश्यक अन्य कागजात प्रयोग गर्न समेत पूर्ण स्वीकृति प्रदान गरियो।
    </p>`;
  }

  // 8. Signatures Block (हस्ताक्षर)
  let signatureHtml = '';
  if (isSingle) {
    signatureHtml = `
    <div style="margin-top: 28px; line-height: 1.5; font-size: 13.5px; page-break-inside: avoid; break-inside: avoid;">
      <div style="font-weight: bold; margin-bottom: 4px;">हस्ताक्षर:</div>
      <div style="height: 35px;"></div>
      <div>श्री ${chairName}</div>
      <div>${chairMember ? chairMember.designation : 'सञ्चालक / प्रोप्राइटर'}</div>
      <div style="font-weight: bold;">${compEn ? compEn : compNp}</div>
    </div>`;
  } else {
    const memberSigs = members.map((m) => `
      <div style="display: inline-block; width: 45%; margin-bottom: 24px; vertical-align: top; page-break-inside: avoid; break-inside: avoid;">
        <div style="height: 35px;"></div>
        <div>${toNepaliDigits(m.index)}. श्री ${m.name}</div>
        <div style="color: #475569; font-size: 12px;">(${m.designation})</div>
        <div style="margin-top: 4px;">दस्तखत: .................................</div>
      </div>
    `).join('');

    signatureHtml = `
    <div style="margin-top: 28px; line-height: 1.5; font-size: 13px; page-break-inside: avoid; break-inside: avoid;">
      <div style="font-weight: bold; margin-bottom: 8px;">हस्ताक्षर (सञ्चालक / शेयरधनीहरू):</div>
      <div style="margin-top: 8px;">
        ${memberSigs}
      </div>
      <div style="margin-top: 10px; font-weight: bold; font-size: 13.5px;">${compEn ? compEn : compNp}</div>
    </div>`;
  }

  return `
  <!-- Meeting Minutes Document (A4 Sheet) -->
  <div class="a4-sheet" style="font-size: 13px; line-height: 1.6; font-family: 'kalimati', serif; padding: 20mm 20mm 20mm 20mm;">
    <div class="doc-content">
      
      <!-- Top Place -->
      <div style="font-weight: bold; font-size: 13.5px; margin-bottom: 12px;">
        स्थान: ${place}
      </div>

      <!-- Meeting Intro Paragraph -->
      <div style="text-align: justify; line-height: 1.65; margin-bottom: 14px; font-size: 13px;">
        ${introHtml}
      </div>

      <!-- Attendance (उपस्थित) -->
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; font-size: 13.5px; margin-bottom: 4px;">उपस्थित</div>
        <div style="line-height: 1.6; margin-left: 2px;">
          ${attendanceHtml}
        </div>
      </div>

      <!-- Proposal / Objectives (प्रस्ताव) -->
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; font-size: 13.5px; margin-bottom: 4px;">प्रस्ताव</div>
        <div>
          ${proposalHtml}
        </div>
      </div>

      <!-- Decision (निर्णय) -->
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; font-size: 13.5px; margin-bottom: 4px;">निर्णय</div>
        <div>
          ${decisionsHtml}
        </div>
      </div>

      <!-- Signatures -->
      ${signatureHtml}

    </div>
  </div>`;
}
