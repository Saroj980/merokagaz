/**
 * AOA Template Renderer — अनुसूची ३
 * एकल शेयरधनी प्रा.लि. नियमावली (Vision Life Sciences format)
 * Handles slugs: pvt-ltd-company-aoa-full, pvt-ltd-company-aoa
 *
 * This renderer loads the versioned template content dynamically from the
 * backend (docLayout.body / DocumentVersion Template), and interpolates all
 * dynamic values (placeholders, tables, Nepali geo addresses, and Iti Sambat).
 */

import type { RendererContext } from '../types';
import { getCurrentNepaliItiDate, toNepaliAddress } from '../helpers';

export function renderAoaFull(ctx: RendererContext): string {
  const { orderData, formData } = ctx;

  // 1. Company Name & Registered Office
  const nameNp     = formData['company.name_np']            || '.....................';
  const nameEn     = formData['company.name_en']            || '..................... Pvt. Ltd.';
  const rawAddress = formData['company.registered_address'] || '.....................';
  const addressNp  = formData['company.registered_address_np'] || toNepaliAddress(rawAddress);

  // 2. Primary Founder / Single Shareholder Fallbacks
  const sh1Name = formData['shareholder_1.full_name']
               || formData['director.md_name']
               || formData['director_name']
               || formData['founder.name']
               || formData['applicant_name']
               || '.....................';

  const rawSh1Addr = formData['shareholder_1.address']
                  || formData['director.address']
                  || rawAddress;
  const sh1AddrNp  = formData['shareholder_1.address_np']
                  || formData['director.address_np']
                  || toNepaliAddress(rawSh1Addr);

  const sh1Dad = formData['shareholder_1.father_name']
              || formData['director.father_name']
              || formData['founder.father_name']
              || formData['father_name']
              || '.....................';

  const sh1Cit = formData['shareholder_1.citizenship_no']
              || formData['director.citizenship_no']
              || formData['founder.citizenship_no']
              || formData['citizenship_no']
              || '.....................';

  const sh1District = formData['shareholder_1.citizenship_district']
                   || formData['director.citizenship_district']
                   || (rawAddress.toLowerCase().includes('kailali') ? 'कैलाली' : rawAddress.toLowerCase().includes('kathmandu') ? 'काठमाडौँ' : '.....................');

  const sh1Shares = formData['shareholder_1.shares']
                 || formData['capital.total_shares']
                 || formData['capital.authorized']
                 || '१००००';

  // 3. Witness
  const witnessName    = formData['witness.name']           || '.....................';
  const rawWitnessAddr = formData['witness.address']        || rawAddress;
  const witnessAddrNp  = formData['witness.address_np']     || toNepaliAddress(rawWitnessAddr);
  const witnessCit     = formData['witness.citizenship_no'] || formData['witness.citizenship'] || '.....................';
  const witnessDist    = formData['witness.citizenship_district'] || (rawWitnessAddr.toLowerCase().includes('kailali') ? 'कैलाली' : '.....................');

  // 4. Masaudakar
  const mName = formData['masaudakar.name']   || '.....................';
  const mReg  = formData['masaudakar.reg_no'] || '.....................';

  // 5. Nepali Iti Sambat Date & Time
  const iti = getCurrentNepaliItiDate(orderData.created_at);
  const itiYear     = formData['iti.year']  || iti.yearNp;
  const itiMonth    = formData['iti.month'] || iti.monthNp;
  const itiDay      = formData['iti.day']   || iti.dayNp;
  const itiRoaj     = formData['iti.roaj']  || iti.rojNp;
  const itiDayNameNp = iti.dayNameNp;
  const itiTime     = iti.timeNp;

  // 6. Dynamic Blocks
  const promoterTableHtml = `
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;">संस्थापकको नाम, ठेगाना र सहिछाप :</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;">बाबु/<br/>पतिको नाम</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;">नागरिकता प्रमाणपत्र नं. र नागरिकता प्राप्त गरेको जिल्ला</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;">लिनु कबुल गरेको शेयर संख्या :</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;">साक्षीको नाम, थर, ठेगाना र सहिछाप :</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;">साक्षीको नागरिकताको प्रमाणपत्र नं. र जिल्ला :</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.35;">
          १. नाम: <b>${sh1Name}</b><br/>
          ठेगाना: ${sh1AddrNp}<br/>
          ना.नं.: <b>${sh1Cit}</b><br/>
          <div style="margin-top:8px;font-size:11.5px;"><b>दस्तखत:</b></div>
          <div style="height:32px;"></div>
          <table style="width:100%;border:none;margin-top:6px;">
            <tr>
              <td style="width:50%;border:none;padding:0;text-align:left;font-size:11.5px;"><b>दायाँ (दा.)</b></td>
              <td style="width:50%;border:none;padding:0;text-align:right;font-size:11.5px;"><b>बायाँ (बा.)</b></td>
            </tr>
            <tr>
              <td style="border:none;padding:0;height:45px;"></td>
              <td style="border:none;padding:0;height:45px;"></td>
            </tr>
          </table>
        </td>
        <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.35;">${sh1Dad}</td>
        <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.35;">
          ना.प्र.नं.: <b>${sh1Cit}</b><br/><br/>
          जि.प्र.का.: <b>${sh1District}</b>
        </td>
        <td style="border:1px solid #374151;padding:7px;text-align:center;vertical-align:top;line-height:1.35;">
          <b>${sh1Shares}</b><br/>थान
        </td>
        <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.35;">
          नाम: <b>${witnessName}</b><br/>
          ठेगाना: ${witnessAddrNp}<br/>
          ना.नं.: <b>${witnessCit}</b><br/>
          <div style="margin-top:8px;font-size:11.5px;"><b>दस्तखत:</b></div>
          <div style="height:32px;"></div>
          <table style="width:100%;border:none;margin-top:6px;">
            <tr>
              <td style="width:50%;border:none;padding:0;text-align:left;font-size:11.5px;"><b>दायाँ (दा.)</b></td>
              <td style="width:50%;border:none;padding:0;text-align:right;font-size:11.5px;"><b>बायाँ (बा.)</b></td>
            </tr>
            <tr>
              <td style="border:none;padding:0;height:45px;"></td>
              <td style="border:none;padding:0;height:45px;"></td>
            </tr>
          </table>
        </td>
        <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.35;">
          ना.प्र.नं.: <b>${witnessCit}</b><br/><br/>
          जि.प्र.का.: <b>${witnessDist}</b>
        </td>
      </tr>
    </tbody>
  </table>`;

  const masaudakarBlockHtml = `
  <div style="margin-top:16px;font-size:13.5px;line-height:1.35;">
    <div><b>मसौदाकार</b></div>
    <div>नाम: ${mName}</div>
    <div>प्र नं: ${mReg}</div>
  </div>`;

  const itiSambatHtml = `
  <div style="margin-top:20px;font-size:13.5px;line-height:1.5;">
    ईति सम्वत् <b>${itiYear}</b> साल <b>${itiMonth}</b> महिना <b>${itiDay}</b> गते रोज <b>${itiRoaj} (${itiDayNameNp})</b> शुभम् (समय: <b>${itiTime}</b>) .................................
  </div>`;

  // 7. Dictionary of dynamic values
  const replacements: Record<string, string> = {
    'company.name_np': nameNp,
    'company.name_en': nameEn,
    'company.registered_address': rawAddress,
    'company.registered_address_np': addressNp,
    'shareholder_1.full_name': sh1Name,
    'shareholder_1.address': rawSh1Addr,
    'shareholder_1.address_np': sh1AddrNp,
    'shareholder_1.father_name': sh1Dad,
    'shareholder_1.citizenship_no': sh1Cit,
    'shareholder_1.citizenship_district': sh1District,
    'shareholder_1.shares': sh1Shares,
    'witness.name': witnessName,
    'witness.address': rawWitnessAddr,
    'witness.address_np': witnessAddrNp,
    'witness.citizenship_no': witnessCit,
    'witness.citizenship_district': witnessDist,
    'masaudakar.name': mName,
    'masaudakar.reg_no': mReg,
    'iti.year': itiYear,
    'iti.month': itiMonth,
    'iti.day': itiDay,
    'iti.roaj': itiRoaj,
    'iti.day_name_np': itiDayNameNp,
    'iti.time': itiTime,
    'iti.sambat': `ईति सम्वत् <b>${itiYear}</b> साल <b>${itiMonth}</b> महिना <b>${itiDay}</b> गते रोज <b>${itiRoaj} (${itiDayNameNp})</b> शुभम् (समय: <b>${itiTime}</b>) .................................`,
    'promoter_table': promoterTableHtml,
    'table.promoters': promoterTableHtml,
    'masaudakar_block': masaudakarBlockHtml,
    'table.masaudakar': masaudakarBlockHtml,
    'iti_sambat_line': itiSambatHtml,
  };

  // 8. Load template body from versioned DB layout or fallback
  const rawTemplate = ctx.docLayout?.body?.trim() || getDefaultAoaTemplate();

  // 9. Interpolate placeholders
  let renderedContent = rawTemplate;

  // Substitute defined replacements
  for (const [key, val] of Object.entries(replacements)) {
    if (val !== undefined && val !== null) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      renderedContent = renderedContent.replaceAll(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), String(val));
    }
  }

  // Substitute any remaining formData keys
  for (const [key, val] of Object.entries(formData)) {
    if (typeof val === 'string' || typeof val === 'number') {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      renderedContent = renderedContent.replaceAll(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), String(val));
    }
  }

  // 10. Wrap in standardized A4 styling if not already wrapped
  if (renderedContent.includes('class="a4-sheet"') || renderedContent.includes("class='a4-sheet'")) {
    return renderedContent;
  }

  return `
  <!-- Full AOA — अनुसूची ३ (Versioned Template) -->
  <div class="a4-sheet" style="font-size: 13.5px; line-height: 1.55; letter-spacing: 0.35px; font-family: 'kalimati', serif;">
    <div class="doc-content">
      ${renderedContent}
    </div>
  </div>`;
}

/**
 * Default fallback template if the backend template body has not yet been seeded
 */
function getDefaultAoaTemplate(): string {
  return `
<!-- Header -->
<div style="text-align: center; margin-bottom: 12px;">
  <div style="font-size: 14px; font-weight: bold;"><b>अनुसूची ३</b></div>
  <div style="font-size: 13px; font-weight: bold; margin-top: 2px;"><b>(दफा ४ को उपदफा (२) सँग सम्बन्धित)</b></div>
  <div style="font-size: 13px; font-weight: bold; margin-top: 2px;"><b>एकल शेयर धनी भएको प्रा.लि. कम्पनीको नियमावलीको</b></div>
  <div style="font-size: 13px; font-weight: bold; margin-top: 2px;"><b>कम्पनी ऐन २०६३ अन्तर्गत संस्थापित</b></div>
  <div style="margin-top: 8px; font-size: 21px; font-weight: bold;"><b>{{company.name_np}} प्रा. लि.</b></div>
  <div style="font-size: 15.5px; font-weight: bold; margin-top: 2px; font-family: 'Times New Roman', times, serif;"><b>{{company.name_en}}</b></div>
  <div style="font-size: 15.5px; font-weight: bold; margin-top: 3px;"><b>नियमावली</b></div>
  <div style="font-size: 14.5px; font-weight: bold; color: #1e293b; margin-top: 3px; letter-spacing: 1.2px; font-family: 'Times New Roman', times, serif;"><b>ARTICLES OF ASSOCIATION</b></div>
</div>

<!-- परिच्छेद १ — प्रारम्भिक -->
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 2px;"><b>परिच्छेद १</b></div>
<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:6px;"><b>प्रारम्भिक</b></div>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>१. कम्पनीको नाम:-</b> यस कम्पनीको नाम <strong>{{company.name_np}}</strong> प्राइभेट लिमिटेड हुनेछ। अंग्रेजीमा <strong>{{company.name_en}}</strong> हुनेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>२. कम्पनीको रजिष्टर्ड कार्यालय रहने ठेगाना:-</b> यस कम्पनीको रजिष्टर्ड कार्यालय <strong>{{company.registered_address_np}}</strong> मा रहनेछ। आवश्यकता अनुसार स्वीकृती लिएर नेपाल राज्यभर अन्य ठाउँमा, पनि रजिष्टर्ड कार्यालय स्थान्तरण गर्न सकिनेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>३. परिभाषा :-</b> विषय वा प्रसंगले अर्को अर्थ नलागेमा यस नियमावलीमा।</p>
<p style="margin:0 0 4px 0;margin-left:18px;line-height:1.55;">क) ऐन भन्नाले कम्पनी ऐन २०६३ लाई सम्झनु पर्छ।</p>
<p style="margin:0 0 4px 0;margin-left:18px;line-height:1.55;">ख) कार्यालय भन्नाले कम्पनी रजिष्ट्रारको कार्यालय सम्झनु पर्छ।</p>
<p style="margin:0 0 6px 0;margin-left:18px;line-height:1.55;">ग) कम्पनी भन्नाले <strong>{{company.name_np}}</strong> प्रा.लि. सम्झनु पर्छ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>४. कम्पनीको उद्देश्य :</b> कम्पनीको उद्देश्य प्रबन्धपत्रको दफा ५ मा उल्लेख भए बमोजिम हुनेछ।</p>

<!-- परिच्छेद २ — शेयरपूँजी तथा ऋण -->
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 2px;"><b>परिच्छेद २</b></div>
<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:6px;"><b>शेयरपूँजी तथा ऋण</b></div>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>५. शेयरको अंकित मूल्य :</b> यस कम्पनीको शेयरको अंकित मूल्य रु १००।- हुनेछ।</p>

<p style="margin:0 0 4px 0;line-height:1.55;"><b>६. शेयरको बिक्री वा धितोबन्धक सम्बन्धी व्यवस्था :</b></p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(१) कम्पनीको शेयर चल सम्पत्ति सरह बिक्री गर्न वा धितोबन्धक राख्न सकिनेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(२) कम्पनीको शेयरधनीले आफ्नो सम्पूर्ण शेयर अर्को व्यक्तिलाई बिक्री गरेमा शेयर खरिद गर्ने व्यक्तिले त्यस्तो शेयर दाखिला खारेज गर्नको निमित्त ऐन बमोजिम कम्पनी रजिष्टर्ड कार्यालयमा निवेदन दिनु पर्नेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(३) उपनियम (२) बमोजिम निवेदन परेमा कम्पनी रजिष्टर्ड कार्यालयले आवश्यक प्रक्रिया पूरा गरी दर्ता किताबमा शेयर खरिद गर्ने व्यक्तिको नाम दर्ता गरीदिनेछ।</p>
<p style="margin:0 0 6px 0;margin-left:15px;line-height:1.55;">(४) उपनियम (२) बमोजिम शेयर खरिद बिक्री भएकोमा त्यसरी खरिद बिक्री भएको पन्ध्र दिनभित्र कार्यालयलाई जानकारी गराउन पर्नेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>७. शेयर प्रमाण पत्र :</b> १) कम्पनीले शेयरधनीलाई निजले लिएको शेयरबापत कम्पनी सचिब वा.शेयरधनीले अधिकार प्रदान गरेको व्यक्तिको सही र कम्पनीले आफ्नो कारोबारमा छाप प्रयोग गर्ने भए कम्पनीको छाप लागेको शेयर प्रमाण पत्र दिइनेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>८. शेयर पूँजी हेरफेर गर्ने कुरा :</b> शेयर धनीको निर्णयबाट ऐन बमोजिम शेयर पूँजी हेरफेर गर्न सकिनेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>९. ऋण उठाउने कुरा :</b> प्रचलित कानूनको अधीनमा रही कम्पनीले आफ्नो व्यवासाय वा कारोबार सञ्चालन गर्नको लागि ऋण उठाउन सक्नेछ।</p>

<!-- परिच्छेद ३ — साधारण सभा तथा सञ्चालक समिति -->
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 2px;"><b>परिच्छेद ३</b></div>
<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:6px;"><b>साधारण सभा तथा सञ्चालक समिति</b></div>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>१०. साधारण सभा :</b> यस कम्पनीको साधारण सभा हुने छैन र साधारण सभाले गर्ने सवै काम शेयरधनी को लिखित निर्णयद्धारा हुनेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>११. सञ्चालक समिति :</b> यस कम्पनीमा सञ्चालक समिति रहने छैन र शेयरधनी आफैले सञ्चालक समितिले गर्नुपर्ने काम गर्नेछ।</p>

<!-- परिच्छेद ४ — हिसाबकिताब लेखा तथा लेखापरीक्षण -->
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 2px;"><b>परिच्छेद ४</b></div>
<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:6px;"><b>हिसाबकिताब लेखा तथा लेखापरीक्षण</b></div>

<p style="margin:0 0 4px 0;line-height:1.55;"><b>१२. कम्पनीको हिसाबकिताब लेखा तथा लेखापरीक्षण :</b></p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">१) यस कम्पनीको लेखा तथा हिसाबकिताब प्रचलित कानून अनुसार अधिकार प्राप्त निकायले निर्धारण गरेको मापदण्ड अनुरुप तयार गरिने छ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(२) कम्पनीले राख्नु पर्ने हिसाब किताब प्रतिदिनको कारोबार स्पष्ट देखिने गरी अद्यावधिक रुपमा राख्नु पर्नेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(३) ऐन बमोजिम तोकिएको रकम भन्दा बढी रकमको बार्षिक कारोबार भएको आर्थिक वर्षमा यस कम्पनीले आफ्नो हिसाबकिताब लेखापरीक्षण गराउनेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(४) उपनियम (३) बमोजिम हिसाबकिताब लेखापरीक्षण गराउनु पर्ने भएमा कम्पनीले ऐन बमोजिम लेखापरीक्षक नियुक्त गर्नेछ। त्यसरी नियुक्त भएको मितिले पन्ध्र दिनभित्र कम्पनीले निजको नाम कार्यालयमा पठाउनेछ।</p>
<p style="margin:0 0 6px 0;margin-left:15px;line-height:1.55;">(५) उपनियम (४) बमोजिम नियुक्त लेखापरीक्षकले लेखापरीक्षण गरेको हिसाबकिताब र लेखाबाट कम्पनी बासलात, नाफानोक्सानीको हिसाब एंव नगद प्रबाह विवरण प्रमाणित गरी आफूलाई नियुक्त गर्ने अधिकारीलाई सम्बोधन गरी आफ्नो प्रतिवेदन कार्यालयलाई र कम्पनी दिनेछ।</p>

<!-- परिच्छेद ५ — विविध -->
<div style="text-align:center;font-weight:bold;font-size:14px;margin:10px 0 2px;"><b>परिच्छेद ५</b></div>
<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:6px;"><b>विविध</b></div>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>१३. कम्पनी सचिब :</b> कम्पनी सचिबको नियुक्ति हुने कम्पनी भए सो सम्बन्धी व्यवस्था, निजको पदावधी सेवा शर्त एंव निजको काम कर्तव्य र अधिकार :- छैन।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>१४. कम्पनी छाप :</b> कम्पनीको आफ्नै छाप हुनेछ र अध्यक्षको जिम्मामा रहनेछ।</p>

<p style="margin:0 0 4px 0;line-height:1.55;"><b>१५. कम्पनी गाभिने व्यवस्था :</b></p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">१) यो कम्पनीमा कुनै अर्को कम्पनी गाभ्न सकिनेछ।</p>
<p style="margin:0 0 6px 0;margin-left:15px;line-height:1.55;">(२) यो कम्पनीलाई कुनै अर्को कम्पनीमा गाभ्नु परेमा कार्यालयको स्वीकृती लिई गाभ्न सकिनेछ।</p>

<p style="margin:0 0 4px 0;line-height:1.55;"><b>१६. कम्पनीको खारेजी :</b></p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">१) यो कम्पनी स्वइच्छाले खारेज हुन चाहेमा कम्पनी खारेजी गर्न सम्बन्धमा शेयरधनीले निर्णय गरी सोको सात दिनभित्र ऐन अनुसार पेश गनुपर्ने लिखतहरु कार्यालयमा पेश गर्नुपर्नेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(२) उपनियम (१) बमोजिम खारेजी निर्णय गर्दा खारेजी कामका लागि एक वा एकभन्दा बढी लिक्विडेटर तथा लेखापरीक्षक नियुक्ती गर्नुपर्नेछ।</p>
<p style="margin:0 0 6px 0;margin-left:15px;line-height:1.55;">(३) उपनियम (२) बमोजिम नियुक्त लिक्विडेटर तथा लेखापरीक्षकले कम्पनी खारेजी सम्बन्धी काम कारवाही गर्नेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>१७. कुनै खास व्यवसाय गर्ने कम्पनीको नियमावलीमा खुलाउनु पर्ने भनी प्रचलित कानूनमा कुनै व्यवस्था गरिएको भए त्यस्तो कुरा :</b> छैन।</p>

<p style="margin:0 0 4px 0;line-height:1.55;"><b>१८. अन्य आवश्यक कुराहरु :</b></p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(१) कम्पनीको आर्थिक वर्ष श्रावण १ गते देखि आषाढ मसान्त सम्म हुनेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(२) यस कम्पनीको कारोबारको सम्बन्धमा शेयरवालाको दायित्व निजले खरिद गरेको वा खरिद गर्न कबुल गरेको शेयरको अधिकतम रकम सम्म मात्र सीमित रहनेछ।</p>
<p style="margin:0 0 4px 0;margin-left:15px;line-height:1.55;">(३) कम्पनी संस्थापना भैसकेपछि यसलाई भिन्नै कानूनी व्यक्तित्व, अविछिन्न उत्तराधिकार-वाला स्वाधिन अस्तित्व भएको मानिनेछ।</p>
<p style="margin:0 0 6px 0;margin-left:15px;line-height:1.55;">(४) स्वीकृती लिनु परेमा लिई कम्पनीले आवश्यकता अनुसार रजिष्टर्ड कार्यालय स्थानान्तरण गर्न सक्नेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>१९. नियमावली संशोधन भएमा लागु हुने अवस्था :</b> यस नियमावलीमा कुनै संशोधन गर्नु पर्ने भएमा शेयरधनीले निर्णय गरी सो निर्णय कार्यालयमा अभिलेख भएपछि मात्र नियमावली संशोधन भएको मानिनेछ।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>२०. नियमावली बाझिएको हदसम्म निष्क्रय हुने :</b> यस नियमावलीमा लेखिएका कुराहरु ऐन, अन्य प्रचलित कानून वा प्रबन्धपत्रसँग बाझिएको हदसम्म स्वतः बदर हुनेछन्।</p>

<p style="margin:0 0 6px 0;line-height:1.55;"><b>२१. संस्थापकले तत्काल लिन कबुल गरेको शेयर संख्या र उद्घोषण :</b> म <strong>{{company.name_np}}</strong> प्रा.लि. को संस्थापकले यो कम्पनी संस्थापना गरी प्रचलित कानून बमोजिम सञ्चालन गर्न मञ्जुर गरेको छु। यो नियमावलीमा उल्लिखित नाम, ठेगाना, हस्ताक्षर, मैले लिन कबुल गरेको शेयर र साक्षी सम्बन्धी व्यहोरा ठीक छ। कुनै कारणले भूट्टा ठहरिन गएमा दर्ता पश्चात् सिर्जना हुने दायित्व व्यहोर्न म तयार छु। यो नियमावलीमा लेखिएका कुरा साँचो हो, भूट्टा ठहरे कानून बमोजिम सहन बुझाउन मञ्जुर छु भनी सहीछाप गरेको छु।</p>

<!-- Promoter Table -->
{{promoter_table}}

<!-- Masaudakar -->
{{masaudakar_block}}

<!-- Iti Sambat -->
{{iti_sambat_line}}
`;
}
