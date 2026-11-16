/**
 * Company Registration Suite Renderer — 4 pages:
 *  Sheet 1: दर्ता दरखास्त निवेदन (Application)
 *  Sheet 2: प्रबन्धपत्र (MOA — Anusuchi 9)
 *  Sheet 3: नियमावली (AOA — Anusuchi 10)
 *  Sheet 4: संस्थापक बैठक निर्णय (Minutes)
 */

import type { RendererContext } from '../types';

export function renderCompanySuite(ctx: RendererContext): string {
  const { orderData, formData, orderDate } = ctx;
  const f = formData;
  const orderNo = orderData.public_order_no;
  const compNp  = f['company.name_np'] || '....................';
  const compEn  = f['company.name_en'] || '....................';
  const sh1     = f['shareholder_1.full_name'] || 'संस्थापक';
  const sh1Cit  = f['shareholder_1.citizenship_no'] || '—';
  const sh1Addr = f['shareholder_1.address'] || '—';
  const sh1Dad  = f['shareholder_1.father_name'] || '—';
  const sh1Grandad = f['shareholder_1.grandfather_name'] || '—';
  const sh1Shares  = f['shareholder_1.shares'] || f['capital.total_shares'] || '—';
  const sh2     = f['shareholder_2.full_name'];
  const witness = f['witness.name'] || 'साक्षी रोहवर';
  const witnessAddr = f['witness.address'] || '—';
  const witnessCit  = f['witness.citizenship_no'] || '—';
  const regAddr = f['company.registered_address'] || '—';
  const capAuth = f['capital.authorized'] || '—';
  const capIss  = f['capital.issued'] || '—';
  const capPaid = f['capital.paid_up'] || '—';
  const capShares = f['capital.total_shares'] || '—';
  const objectives = (f['company.main_objectives'] || 'सेवा तथा व्यापारमूलक व्यवसाय गर्ने।').replace(/\n/g, '<br/>');
  const bizType = f['company.business_type'] || 'सेवा तथा व्यापारमूलक';

  const sh2Row = sh2 ? `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px;">२</td>
      <td style="border:1px solid #cbd5e1;padding:6px;"><strong>${sh2}</strong><br/>${f['shareholder_2.address'] || '—'}<br/>ना.प्र.नं: ${f['shareholder_2.citizenship_no'] || '—'}</td>
      <td style="border:1px solid #cbd5e1;padding:6px;">बाबु: ${f['shareholder_2.father_name'] || '—'}<br/>बाजे: ${f['shareholder_2.grandfather_name'] || '—'}</td>
      <td style="border:1px solid #cbd5e1;padding:6px;"><strong>${f['shareholder_2.shares'] || '—'}</strong></td>
      <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">..................</td>
    </tr>` : '';

  return `
  <!-- SHEET 1: दर्ता दरखास्त निवेदन -->
  <div class="a4-sheet" id="sheet-app" style="margin-bottom:24px;">
    <div class="doc-content">
      <div class="letterhead">
        <div class="nepal-emblem-text">अनुसूची - १ (नियम ३ सँग सम्बन्धित)</div>
        <div class="letterhead-details" style="font-weight:700;font-size:15px;">कम्पनी दर्ताको लागि दरखास्त फारम</div>
      </div>
      <div class="ref-line">
        <span>टोकन: ${orderNo}</span>
        <span>मिति: ${orderDate}</span>
      </div>
      <div class="office-block">
        श्रीमान् रजिष्ट्रार ज्यू,<br/>
        कम्पनी रजिष्ट्रारको कार्यालय,<br/>
        त्रिपुरेश्वर, काठमाडौँ।
      </div>
      <div class="subject-block">विषय: <u>कम्पनी दर्ता गरी प्रमाणपत्र पाउँ बारे।</u></div>
      <div class="body-content">
        <p style="margin-bottom:14px;line-height:1.8;text-align:justify;">
          महोदय,<br/>
          हामी तपसिलका संस्थापकहरू मिली कम्पनी ऐन, २०६३ बमोजिम <strong>"${compNp}"</strong> (अंग्रेजीमा <strong>"${compEn}"</strong>) नामको प्राइभेट लिमिटेड कम्पनी स्थापना गर्न मञ्जुर भई कम्पनीको प्रबन्धपत्र (२ प्रति) तथा नियमावली (२ प्रति) र रीतपूर्वकको शुल्क समेत यसै साथ संलग्न राखी यो दरखास्त पेश गरेका छौँ।
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:14px;font-size:12px;">
          <strong>कम्पनीको मुख्य विवरण:</strong><br/>
          • कम्पनीको नाम: ${compNp} (${compEn})<br/>
          • रजिष्टर्ड कार्यालय रहने ठेगाना: ${regAddr}<br/>
          • अधिकृत पुँजी: रु. ${capAuth} | जारी पुँजी: रु. ${capIss} | चुक्ता पुँजी: रु. ${capPaid}<br/>
          • शेयर कित्ता: प्रति शेयर रु. १०० का दरले जम्मा ${capShares}<br/>
          • मुख्य कारोबार: ${bizType}
        </div>
        <p style="margin-bottom:14px;line-height:1.8;text-align:justify;">
          प्रचलित कम्पनी ऐन तथा नेपालको कानुनको अधीनमा रही कारोबार सञ्चालन गर्ने व्यहोरा जाहेर गर्दै उक्त कम्पनी दर्ता गरी कम्पनी दर्ता प्रमाणपत्र उपलब्ध गराइदिनुहुन सादर अनुरोध गर्दछौँ।
        </p>
      </div>
      <div class="declaration-box">
        प्रमाणित गरिन्छ: प्रस्तुत निवेदनमा उल्लिखित सम्पूर्ण विवरण तथा संलग्न कागजातहरू सत्य, तथ्य र कानुनी रूपमा सही छन्।
      </div>
    </div>
    <div class="sign-section">
      <div class="sig-applicant">
        <div class="sig-line">${sh1}</div>
        <div class="sig-label">मुख्य संस्थापक / निवेदक</div>
        <div class="sig-label">नागरिकता नं: ${sh1Cit}</div>
      </div>
      <div class="seal-box"><span>कम्पनी दर्ता</span><span>स्वीकृत</span><span>OCR VERIFIED</span></div>
      <div style="text-align:right;width:200px;">
        <div class="sig-line" style="justify-content:flex-end;">संस्थापक प्रतिनिधि</div>
        <div class="sig-label">संस्थापकहरूको तर्फबाट</div>
        <div class="sig-label">Mero Kagaz Legal System</div>
      </div>
    </div>
    <div class="footer-security">
      <span>Order: ${orderNo}</span>
      <span>कागजात १ / ४ : कम्पनी दर्ता दरखास्त</span>
      <span>Page 1 of 4</span>
    </div>
  </div>

  <!-- SHEET 2: प्रबन्धपत्र (MOA) -->
  <div class="a4-sheet" id="sheet-moa" style="margin-bottom:24px;">
    <div class="doc-content">
      <div class="letterhead">
        <div class="nepal-emblem-text">अनुसूची - ९ (नियम २३ सँग सम्बन्धित)</div>
        <div class="letterhead-details" style="font-weight:700;font-size:15px;">
          ${compNp} को<br/>प्रबन्धपत्र (Memorandum of Association)
        </div>
      </div>
      <div class="ref-line">
        <span>कम्पनी ऐन, २०६३ को दफा ४ बमोजिम</span>
        <span>मिति: ${orderDate}</span>
      </div>
      <div class="body-content" style="font-size:12px;line-height:1.8;">
        <p style="margin-bottom:8px;"><strong>१. कम्पनीको नाम:</strong> यस कम्पनीको नाम नेपालीमा <strong>"${compNp}"</strong> र अंग्रेजीमा <strong>"${compEn}"</strong> रहनेछ।</p>
        <p style="margin-bottom:8px;"><strong>२. रजिष्टर्ड कार्यालय:</strong> कम्पनीको रजिष्टर्ड कार्यालय <strong>${regAddr}</strong> मा रहनेछ।</p>
        <p style="margin-bottom:8px;"><strong>३. दायित्व सीमित:</strong> शेयरधनीहरूको दायित्व उनीहरूले खरिद गरेको शेयरको अधिकतम रकमसम्म सीमित रहनेछ।</p>
        <p style="margin-bottom:8px;"><strong>४. पुँजीको संरचना:</strong><br/>
          (क) अधिकृत पुँजी: रु. <strong>${capAuth}</strong><br/>
          (ख) जारी पुँजी: रु. <strong>${capIss}</strong><br/>
          (ग) चुक्ता पुँजी: रु. <strong>${capPaid}</strong> (प्रति शेयर रु. १०० का दरले ${capShares} कित्ता साधारण शेयरमा विभाजित)।
        </p>
        <p style="margin-bottom:8px;"><strong>५. कम्पनीको मुख्य उद्देश्यहरू:</strong><br/>${objectives}</p>
        <p style="margin-bottom:8px;"><strong>६. संस्थापक शेयरधनीहरूको कबुलियत:</strong><br/>
          हामी संस्थापकहरू यस प्रबन्धपत्रमा लेखिए बमोजिमको संख्यामा शेयर लिन मञ्जुर भई आ-आफ्नो नाम अगाडि सहिछाप गर्दछौँ।
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px;">
          <thead>
            <tr style="background:#f1f5f9;text-align:left;">
              <th style="border:1px solid #cbd5e1;padding:6px;">क्र.सं.</th>
              <th style="border:1px solid #cbd5e1;padding:6px;">संस्थापकको नाम/ठेगाना</th>
              <th style="border:1px solid #cbd5e1;padding:6px;">बाबु/बाजेको नाम</th>
              <th style="border:1px solid #cbd5e1;padding:6px;">लिएको शेयर</th>
              <th style="border:1px solid #cbd5e1;padding:6px;">दस्तखत</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:6px;">१</td>
              <td style="border:1px solid #cbd5e1;padding:6px;"><strong>${sh1}</strong><br/>${sh1Addr}<br/>ना.प्र.नं: ${sh1Cit}</td>
              <td style="border:1px solid #cbd5e1;padding:6px;">बाबु: ${sh1Dad}<br/>बाजे: ${sh1Grandad}</td>
              <td style="border:1px solid #cbd5e1;padding:6px;"><strong>${sh1Shares}</strong></td>
              <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">..................</td>
            </tr>
            ${sh2Row}
          </tbody>
        </table>
      </div>
      <div style="margin-top:14px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;">
        <strong>रोहवर / साक्षी:</strong> ${witness}, ठेगाना: ${witnessAddr}, नागरिकता नं: ${witnessCit} (दस्तखत: ................)
      </div>
    </div>
    <div class="footer-security">
      <span>Order: ${orderNo}</span>
      <span>कागजात २ / ४ : कम्पनी प्रबन्धपत्र (MOA)</span>
      <span>Page 2 of 4</span>
    </div>
  </div>

  <!-- SHEET 3: नियमावली (AOA) -->
  <div class="a4-sheet" id="sheet-aoa" style="margin-bottom:24px;">
    <div class="doc-content">
      <div class="letterhead">
        <div class="nepal-emblem-text">अनुसूची - १० (नियम २३ सँग सम्बन्धित)</div>
        <div class="letterhead-details" style="font-weight:700;font-size:15px;">
          ${compNp} को<br/>नियमावली (Articles of Association)
        </div>
      </div>
      <div class="ref-line">
        <span>कम्पनी ऐन, २०६३ को दफा ४ बमोजिम</span>
        <span>मिति: ${orderDate}</span>
      </div>
      <div class="body-content" style="font-size:12px;line-height:1.8;">
        <p style="margin-bottom:8px;"><strong>१. प्रारम्भ:</strong> यो नियमावली कम्पनी रजिष्ट्रारको कार्यालयबाट कम्पनी दर्ता भएको मितिदेखि लागू हुनेछ।</p>
        <p style="margin-bottom:8px;"><strong>२. शेयर बाँडफाँड:</strong> कम्पनीको शेयर बोर्डको निर्णय बमोजिम संस्थापक शेयरधनीहरूमा बाँडफाँड गरिनेछ। शेयर प्रमाणपत्रमा अध्यक्ष वा प्रबन्ध सञ्चालकको दस्तखत र कम्पनीको छाप रहनेछ।</p>
        <p style="margin-bottom:8px;"><strong>३. साधारण सभा तथा गणपूरक संख्या:</strong> कम्पनीको प्रथम वार्षिक साधारण सभा कम्पनी दर्ता भएको एक वर्षभित्र र त्यसपछि प्रत्येक आर्थिक वर्ष समाप्त भएको ६ महिनाभित्र सम्पन्न गरिनेछ। कुल शेयरको ५१% प्रतिनिधित्व भएमा गणपूरक संख्या पुगेको मानिनेछ।</p>
        <p style="margin-bottom:8px;"><strong>४. सञ्चालक समिति र प्रबन्ध सञ्चालक:</strong><br/>
          (क) सञ्चालक समितिमा कम्तीमा १ जना र बढीमा ५ जनासम्म सञ्चालकहरू रहनेछन्।<br/>
          (ख) कम्पनीको दैनिक कार्य सञ्चालन तथा प्रशासनिक अधिकार प्रबन्ध सञ्चालक <strong>${sh1}</strong> मा निहित रहनेछ।
        </p>
        <p style="margin-bottom:8px;"><strong>५. बैंक खाता सञ्चालन:</strong> कम्पनीको नाममा 'क' वा 'ख' वर्गको वाणिज्य बैंकमा खाता खोली प्रबन्ध सञ्चालकको एकल वा तोकिएको सञ्चालकको संयुक्त दस्तखतबाट सञ्चालन हुनेछ।</p>
        <p style="margin-bottom:8px;"><strong>६. लेखापरीक्षण तथा छाप:</strong> कम्पनीको आर्थिक कारोबारको लेखापरीक्षण दर्तावाला लेखापरीक्षक (CA/RA) बाट गराइनेछ। कम्पनीको छुट्टै आधिकारिक छाप (Seal) रहनेछ।</p>
      </div>
      <div class="declaration-box">हामी तपसिलका संस्थापकहरू माथि उल्लिखित सम्पूर्ण नियम तथा सर्तहरू पालना गर्न पूर्ण मञ्जुर भई यो नियमावलीमा हस्ताक्षर गर्दछौँ।</div>
    </div>
    <div class="sign-section">
      <div class="sig-applicant">
        <div class="sig-line">${sh1}</div>
        <div class="sig-label">प्रबन्ध सञ्चालक / संस्थापक</div>
        <div class="sig-label">दस्तखत: ................................</div>
      </div>
      <div class="seal-box"><span>नियमावली</span><span>प्रमाणित</span><span>AOA APPROVED</span></div>
      <div style="text-align:right;width:200px;">
        <div class="sig-line" style="justify-content:flex-end;">${witness}</div>
        <div class="sig-label">साक्षीको दस्तखत</div>
        <div class="sig-label">ठेगाना: ${witnessAddr}</div>
      </div>
    </div>
    <div class="footer-security">
      <span>Order: ${orderNo}</span>
      <span>कागजात ३ / ४ : कम्पनी नियमावली (AOA)</span>
      <span>Page 3 of 4</span>
    </div>
  </div>

  <!-- SHEET 4: संस्थापक बैठक निर्णय (Minutes) -->
  <div class="a4-sheet" id="sheet-res">
    <div class="doc-content">
      <div class="letterhead">
        <div class="nepal-emblem-text">संस्थापकहरूको प्रारम्भिक बैठकको निर्णय (माइन्युट)</div>
        <div class="letterhead-details" style="font-weight:700;font-size:15px;">${compNp} दर्ता सम्बन्धी निर्णय</div>
      </div>
      <div class="ref-line">
        <span>बैठक मिति: ${orderDate}</span>
        <span>स्थान: कम्पनीको प्रस्तावित कार्यालय</span>
      </div>
      <div class="body-content" style="font-size:12px;line-height:1.8;">
        <p style="margin-bottom:12px;text-align:justify;">
          आज मिति <strong>${orderDate}</strong> का दिन प्रस्तावित <strong>"${compNp}"</strong> का सम्पूर्ण संस्थापक शेयरधनीहरूको उपस्थितिमा प्रारम्भिक बैठक बसी निम्न बमोजिमका निर्णयहरू सर्वसम्मत रूपमा पारित गरियो:
        </p>
        <p style="margin-bottom:10px;"><strong>निर्णय नं. १ (कम्पनी दर्ता गर्ने):</strong> कम्पनी ऐन, २०६३ अन्तर्गत अधिकृत पुँजी रु. <strong>${capAuth}</strong> तथा जारी पुँजी रु. <strong>${capIss}</strong> रहने गरी कम्पनी रजिष्ट्रारको कार्यालय, त्रिपुरेश्वर काठमाडौँमा कम्पनी दर्ता प्रक्रिया अगाडि बढाउने निर्णय गरियो।</p>
        <p style="margin-bottom:10px;"><strong>निर्णय नं. २ (प्रबन्धपत्र तथा नियमावली स्वीकृति):</strong> तयार पारिएको प्रबन्धपत्र र नियमावलीका सम्पूर्ण दफा तथा सर्तहरू अध्ययन गरी सर्वसम्मतिले अनुमोदन गरियो।</p>
        <p style="margin-bottom:10px;"><strong>निर्णय नं. ३ (अख्तियारी प्रत्यायोजन):</strong> कम्पनी दर्ता सम्बन्धी निवेदन पेश गर्न, राजस्व बुझाउन, अनलाइन पोर्टल प्रविष्ट गर्न तथा आवश्यक सम्पूर्ण प्रक्रिया पूरा गर्न संस्थापक शेयरधनी श्री <strong>${sh1}</strong> ज्यूलाई सर्वसम्मत अख्तियारी दिने निर्णय गरियो।</p>
      </div>
      <div class="declaration-box">उपरोक्त सम्पूर्ण निर्णयहरू हामी संस्थापकहरूको पूर्ण सहमतिमा बैठक पुस्तिकामा अभिलेख गरी प्रमाणित गरिएको छ।</div>
    </div>
    <div class="sign-section">
      <div class="sig-applicant">
        <div class="sig-line">${sh1}</div>
        <div class="sig-label">बैठकका अध्यक्ष / प्रबन्ध सञ्चालक</div>
        <div class="sig-label">दस्तखत: ................................</div>
      </div>
      <div class="seal-box"><span>माइन्युट</span><span>निर्णय</span><span>MINUTES</span></div>
      <div style="text-align:right;width:200px;">
        <div class="sig-line" style="justify-content:flex-end;">${witness}</div>
        <div class="sig-label">रोहवर साक्षी</div>
        <div class="sig-label">Mero Kagaz System Certified</div>
      </div>
    </div>
    <div class="footer-security">
      <span>Order: ${orderNo}</span>
      <span>कागजात ४ / ४ : संस्थापक बैठक निर्णय (Minutes)</span>
      <span>Page 4 of 4 (अन्तिम पृष्ठ)</span>
    </div>
  </div>`;
}
