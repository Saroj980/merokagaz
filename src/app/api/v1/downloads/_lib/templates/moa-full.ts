/**
 * MOA Template Renderer — अनुसूची ९ (दफा १८ को उपदफा ६ सँग सम्बन्धित)
 * आधिकारिक कम्पनी ऐन, २०६३ बमोजिमको १६-दफे प्रबन्धपत्र
 * एकल शेयरधनी (Single Shareholder) र बहु-शेयरधनी (Multi-Shareholder) दुवैलाई पूर्ण समर्थन गर्दछ।
 * Handles slugs: pvt-ltd-company-moa-full, pvt-ltd-company-moa
 */

import type { RendererContext } from '../types';
import { getCurrentNepaliItiDate, toNepaliAddress } from '../helpers';

interface ShareholderItem {
  index: number;
  name: string;
  address: string;
  fatherName: string;
  citizenshipNo: string;
  district: string;
  shares: string;
}

function toNepaliDigits(val: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(val).replace(/\d/g, (d) => nepaliDigits[Number(d)]);
}

const ALL_DISTRICTS: Record<string, string> = {
  // English lowercase
  'kailali': 'कैलाली',
  'kathmandu': 'काठमाडौँ',
  'lalitpur': 'ललितपुर',
  'bhaktapur': 'भक्तपुर',
  'bajhang': 'बझाङ',
  'bajura': 'बाजुरा',
  'achham': 'अछाम',
  'doti': 'डोटी',
  'kanchanpur': 'कञ्चनपुर',
  'dadeldhura': 'डडेलधुरा',
  'baitadi': 'बैतडी',
  'darchula': 'दार्चुला',
  'chitwan': 'चितवन',
  'kaski': 'कास्की',
  'pokhara': 'कास्की',
  'morang': 'मोरङ',
  'biratnagar': 'मोरङ',
  'jhapa': 'झापा',
  'sunsari': 'सुनसरी',
  'dharan': 'सुनसरी',
  'rupandehi': 'रुपन्देही',
  'butwal': 'रुपन्देही',
  'banke': 'बाँके',
  'nepalgunj': 'बाँके',
  'bardiya': 'बर्दिया',
  'surkhet': 'सुर्खेत',
  'dang': 'दाङ',
  'parsa': 'पर्सा',
  'birgunj': 'पर्सा',
  'dhanusha': 'धनुषा',
  'janakpur': 'धनुषा',
  'makwanpur': 'मकवानपुर',
  'hetauda': 'मकवानपुर',
  'kavre': 'काभ्रेपलाञ्चोक',
  'kavrepalanchok': 'काभ्रेपलाञ्चोक',
  'sindhupalchok': 'सिन्धुपाल्चोक',
  'tanahun': 'तनहुँ',
  'tanahu': 'तनहुँ',
  'gorkha': 'गोरखा',
  'syangja': 'स्याङ्जा',
  'nawalparasi': 'नवलपरासी',
  'nawalpur': 'नवलपरासी (ब.सु.पू.)',
  'parasi': 'नवलपरासी (ब.सु.प.)',
  'palpa': 'पाल्पा',
  'gulmi': 'गुल्मी',
  'arghakhanchi': 'अर्घाखाँची',
  'baglung': 'बागलुङ',
  'myagdi': 'म्याग्दी',
  'parbat': 'पर्वत',
  'mustang': 'मुस्ताङ',
  'manang': 'मनाङ',
  'lamjung': 'लमजुङ',
  'dhading': 'धादिङ',
  'nuwakot': 'नुवाकोट',
  'rasuwa': 'रसुवा',
  'dolakha': 'दोलखा',
  'ramechhap': 'रामेछाप',
  'sindhuli': 'सिन्धुली',
  'sarlahi': 'सर्लाही',
  'rautahat': 'रौतहट',
  'bara': 'बारा',
  'mahottari': 'महोत्तरी',
  'siraha': 'सिराहा',
  'saptari': 'सप्तरी',
  'ilam': 'इलाम',
  'panchthar': 'पाँचथर',
  'taplejung': 'ताप्लेजुङ',
  'dhankuta': 'धनकुटा',
  'terhathum': 'तेह्रथुम',
  'sankhuwasabha': 'सङ्खुवासभा',
  'bhojpur': 'भोजपुर',
  'solukhumbu': 'सोलुखुम्बु',
  'okhaldhunga': 'ओखलढुङ्गा',
  'khotang': 'खोटाङ',
  'udayapur': 'उदयपुर',
  'pyuthan': 'प्युठान',
  'rolpa': 'रोल्पा',
  'rukum': 'रुकुम',
  'salyan': 'सल्यान',
  'dailekh': 'दैलेख',
  'jajarkot': 'जाजरकोट',
  'jumla': 'जुम्ला',
  'kalikot': 'कालिकोट',
  'mugu': 'मुगु',
  'humla': 'हुम्ला',
  'dolpa': 'डोल्पा',
  // Nepali
  'कैलाली': 'कैलाली',
  'काठमाडौँ': 'काठमाडौँ',
  'काठमाडौं': 'काठमाडौँ',
  'ललितपुर': 'ललितपुर',
  'भक्तपुर': 'भक्तपुर',
  'बझाङ': 'बझाङ',
  'बाजुरा': 'बाजुरा',
  'अछाम': 'अछाम',
  'डोटी': 'डोटी',
  'कञ्चनपुर': 'कञ्चनपुर',
  'डडेलधुरा': 'डडेलधुरा',
  'बैतडी': 'बैतडी',
  'दार्चुला': 'दार्चुला',
  'चितवन': 'चितवन',
  'कास्की': 'कास्की',
  'मोरङ': 'मोरङ',
  'झापा': 'झापा',
  'सुनसरी': 'सुनसरी',
  'रुपन्देही': 'रुपन्देही',
  'बाँके': 'बाँके',
  'बर्दिया': 'बर्दिया',
  'सुर्खेत': 'सुर्खेत',
  'दाङ': 'दाङ',
  'पर्सा': 'पर्सा',
  'धनुषा': 'धनुषा',
  'मकवानपुर': 'मकवानपुर',
  'काभ्रे': 'काभ्रेपलाञ्चोक',
  'काभ्रेपलाञ्चोक': 'काभ्रेपलाञ्चोक',
  'सिन्धुपाल्चोक': 'सिन्धुपाल्चोक',
  'तनहुँ': 'तनहुँ',
  'गोरखा': 'गोरखा',
  'स्याङ्जा': 'स्याङ्जा',
  'नवलपरासी': 'नवलपरासी',
  'पाल्पा': 'पाल्पा',
  'गुल्मी': 'गुल्मी',
  'अर्घाखाँची': 'अर्घाखाँची',
  'बागलुङ': 'बागलुङ',
  'म्याग्दी': 'म्याग्दी',
  'पर्वत': 'पर्वत',
  'मुस्ताङ': 'मुस्ताङ',
  'मनाङ': 'मनाङ',
  'लमजुङ': 'लमजुङ',
  'धादिङ': 'धादिङ',
  'नुवाकोट': 'नुवाकोट',
  'रसुवा': 'रसुवा',
  'दोलखा': 'दोलखा',
  'रामेछाप': 'रामेछाप',
  'सिन्धुली': 'सिन्धुली',
  'सर्लाही': 'सर्लाही',
  'रौतहट': 'रौतहट',
  'बारा': 'बारा',
  'महोत्तरी': 'महोत्तरी',
  'सिराहा': 'सिराहा',
  'सप्तरी': 'सप्तरी',
  'इलाम': 'इलाम',
  'पाँचथर': 'पाँचथर',
  'ताप्लेजुङ': 'ताप्लेजुङ',
  'धनकुटा': 'धनकुटा',
  'तेह्रथुम': 'तेह्रथुम',
  'सङ्खुवासभा': 'सङ्खुवासभा',
  'भोजपुर': 'भोजपुर',
  'सोलुखुम्बु': 'सोलुखुम्बु',
  'ओखलढुङ्गा': 'ओखलढुङ्गा',
  'खोटाङ': 'खोटाङ',
  'उदयपुर': 'उदयपुर',
  'प्युठान': 'प्युठान',
  'रोल्पा': 'रोल्पा',
  'रुकुम': 'रुकुम',
  'सल्यान': 'सल्यान',
  'दैलेख': 'दैलेख',
  'जाजरकोट': 'जाजरकोट',
  'जुम्ला': 'जुम्ला',
  'कालिकोट': 'कालिकोट',
  'मुगु': 'मुगु',
  'हुम्ला': 'हुम्ला',
  'डोल्पा': 'डोल्पा',
};

// District code from citizenship prefix (e.g. 67-01-70-... -> 67 = Kailali)
const CIT_PREFIX_MAP: Record<string, string> = {
  '67': 'कैलाली',
  '75': 'कञ्चनपुर',
  '68': 'डोटी',
  '70': 'बझाङ',
  '71': 'बाजुरा',
  '72': 'अछाम',
  '73': 'डडेलधुरा',
  '74': 'बैतडी',
  '76': 'दार्चुला',
  '27': 'काठमाडौँ',
  '26': 'ललितपुर',
  '25': 'भक्तपुर',
  '31': 'चितवन',
  '38': 'कास्की',
  '12': 'मोरङ',
  '04': 'झापा',
  '05': 'इलाम',
  '01': 'ताप्लेजुङ',
  '02': 'पाँचथर',
  '06': 'झापा',
  '10': 'सुनसरी',
  '48': 'रुपन्देही',
  '57': 'बाँके',
  '58': 'बर्दिया',
  '60': 'सुर्खेत',
  '56': 'दाङ',
  '34': 'पर्सा',
  '20': 'धनुषा',
  '32': 'मकवानपुर',
};

function toEnglishDigits(str: string): string {
  const nepToEn: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return str.replace(/[०-९]/g, (ch) => nepToEn[ch] || ch);
}

function extractDistrictFromText(text: string): string {
  if (!text) return '.....................';
  const lower = text.toLowerCase();
  for (const [key, nepName] of Object.entries(ALL_DISTRICTS)) {
    if (lower.includes(key.toLowerCase()) || text.includes(key)) {
      return nepName;
    }
  }
  return '.....................';
}

function parseCitizenshipAndDistrict(
  rawCit?: string,
  explicitDistrict?: string,
  fallbackAddress?: string
): { citizenshipNo: string; district: string } {
  let citStr = (rawCit || '').trim();
  let foundDistrict = '';

  // 1. Explicit district provided
  if (explicitDistrict && explicitDistrict.trim() && explicitDistrict !== '.....................') {
    const matched = extractDistrictFromText(explicitDistrict);
    foundDistrict = matched !== '.....................' ? matched : explicitDistrict.trim();
  }

  // 2. Check if rawCit contains both citizenship number and district (e.g. "67-01-70-05814, Kailali")
  if (citStr) {
    const distFromCit = extractDistrictFromText(citStr);
    if (distFromCit && distFromCit !== '.....................') {
      if (!foundDistrict || foundDistrict === '.....................') {
        foundDistrict = distFromCit;
      }
      // Clean citStr by removing the district name and any commas/slashes
      for (const [key] of Object.entries(ALL_DISTRICTS)) {
        const regex = new RegExp(`[,\\/\\s(-]*${key}[)\\s-]*`, 'gi');
        citStr = citStr.replace(regex, '').trim();
      }
      citStr = citStr.replace(/[,\\/\\s-]+$/, '').trim();
    }
  }

  // 3. Fallback to extracting district from address
  if (!foundDistrict || foundDistrict === '.....................') {
    if (fallbackAddress) {
      foundDistrict = extractDistrictFromText(fallbackAddress);
    }
  }

  // 4. Fallback to citizenship prefix code (e.g. 67- -> Kailali)
  if (!foundDistrict || foundDistrict === '.....................') {
    const match = citStr.match(/^([0-9०-९]{2})[-/]/);
    if (match) {
      const codeEn = toEnglishDigits(match[1]);
      if (CIT_PREFIX_MAP[codeEn]) {
        foundDistrict = CIT_PREFIX_MAP[codeEn];
      }
    }
  }

  return {
    citizenshipNo: citStr || '.....................',
    district: foundDistrict && foundDistrict !== '.....................' ? foundDistrict : '.....................',
  };
}

export function renderMoaFull(ctx: RendererContext): string {
  const { orderData, formData } = ctx;

  // 1. Company Name & Registered Office
  let nameNp = formData['company.name_np'] || formData['company_name_np'] || '.....................';
  if (!nameNp.includes('प्रा.लि.') && !nameNp.includes('लिमिटेड') && nameNp !== '.....................') {
    nameNp = `${nameNp} प्रा.लि.`;
  }
  let nameEn = formData['company.name_en'] || formData['company_name_en'] || '..................... Pvt. Ltd.';
  if (!nameEn.toLowerCase().includes('pvt') && !nameEn.toLowerCase().includes('ltd') && nameEn !== '..................... Pvt. Ltd.') {
    nameEn = `${nameEn} Pvt. Ltd.`;
  }

  const rawAddress = formData['company.registered_address'] || formData['registered_office'] || '.....................';
  const addressNp  = formData['company.registered_address_np'] || toNepaliAddress(rawAddress);

  // Business Nature
  const businessNature = formData['company.business_type']
                      || formData['company.business_nature']
                      || 'व्यापारमुलक';

  // 2. Capital Structure
  const capAuth   = formData['capital.authorized']   || '२५,००,०००';
  const capIssued = formData['capital.issued']       || '२४,००,०००';
  const capPaidUp = formData['capital.paid_up']      || '२४,००,०००';
  const totalShares = formData['capital.total_shares'] || '२५,०००';
  const issuedShares = formData['capital.issued_shares'] || '२४,०००';
  const paidUpShares = formData['capital.paid_up_shares'] || issuedShares;

  const capAuthWords = formData['capital.authorized_in_words']
                    || formData['capital.authorized_words']
                    || 'पच्चिस लाख रुपैयाँ मात्र';
  const capIssuedWords = formData['capital.issued_in_words']
                      || formData['capital.issued_words']
                      || 'चौविस लाख रुपैयाँ मात्र';
  const capPaidUpWords = formData['capital.paid_up_in_words']
                      || formData['capital.paid_up_words']
                      || 'चौविस लाख रुपैयाँ मात्र';

  // 3. Extract All Shareholders (Single or Multiple)
  const shareholders: ShareholderItem[] = [];

  // Check if JSON array passed in formData['shareholders']
  if (Array.isArray((formData as any).shareholders)) {
    (formData as any).shareholders.forEach((s: any, idx: number) => {
      const shAddr = s.address_np || toNepaliAddress(s.address || rawAddress);
      const parsedCit = parseCitizenshipAndDistrict(s.citizenship_no, s.citizenship_district, shAddr);
      shareholders.push({
        index: idx + 1,
        name: s.name || s.full_name || '.....................',
        address: shAddr,
        fatherName: s.father_name || s.father || '.....................',
        citizenshipNo: parsedCit.citizenshipNo,
        district: parsedCit.district,
        shares: s.shares ? toNepaliDigits(s.shares) : '.....................',
      });
    });
  }

  // If no array, scan shareholder_1, shareholder_2, ... shareholder_10
  if (shareholders.length === 0) {
    // Primary Shareholder (Shareholder 1)
    const sh1Name = formData['shareholder_1.full_name']
                 || formData['shareholder_1.name']
                 || formData['director.md_name']
                 || formData['director.full_name']
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

    const rawSh1Cit = formData['shareholder_1.citizenship_no']
                   || formData['director.citizenship_no']
                   || formData['founder.citizenship_no']
                   || formData['citizenship_no']
                   || '';

    const rawSh1Dist = formData['shareholder_1.citizenship_district']
                    || formData['director.citizenship_district'];

    const parsedSh1Cit = parseCitizenshipAndDistrict(rawSh1Cit, rawSh1Dist, rawSh1Addr);

    const sh1Shares = formData['shareholder_1.shares']
                   || formData['capital.issued_shares']
                   || '.....................';

    shareholders.push({
      index: 1,
      name: sh1Name,
      address: sh1AddrNp,
      fatherName: sh1Dad,
      citizenshipNo: parsedSh1Cit.citizenshipNo,
      district: parsedSh1Cit.district,
      shares: sh1Shares,
    });

    // Check for shareholder_2 to shareholder_10
    for (let i = 2; i <= 10; i++) {
      const shName = formData[`shareholder_${i}.full_name`] || formData[`shareholder_${i}.name`];
      if (shName && shName.trim()) {
        const rawAddr = formData[`shareholder_${i}.address`] || rawSh1Addr;
        const addrNp  = formData[`shareholder_${i}.address_np`] || toNepaliAddress(rawAddr);
        const dad     = formData[`shareholder_${i}.father_name`] || '.....................';
        const rawCit  = formData[`shareholder_${i}.citizenship_no`];
        const rawDist = formData[`shareholder_${i}.citizenship_district`];
        const parsedCit = parseCitizenshipAndDistrict(rawCit, rawDist, rawAddr);
        const shares  = formData[`shareholder_${i}.shares`] || '.....................';

        shareholders.push({
          index: i,
          name: shName.trim(),
          address: addrNp,
          fatherName: dad,
          citizenshipNo: parsedCit.citizenshipNo,
          district: parsedCit.district,
          shares: shares,
        });
      }
    }
  }

  const isSingleShareholder = shareholders.length <= 1;

  // 4. Witness Details (Rohabar)
  const witnessName    = formData['witness.name'] || formData['witness.full_name'] || '.....................';
  const rawWitnessAddr = formData['witness.address'] || rawAddress;
  const witnessAddrNp  = formData['witness.address_np'] || toNepaliAddress(rawWitnessAddr);
  const rawWitnessCit  = formData['witness.citizenship_no'] || formData['witness.citizenship'] || '';
  const rawWitnessDist = formData['witness.citizenship_district'];
  const parsedWitnessCit = parseCitizenshipAndDistrict(rawWitnessCit, rawWitnessDist, rawWitnessAddr);

  // 5. Objectives (Clause 4)
  const rawObjectives = formData['company.main_objectives'] || formData['company_objectives'] || '';
  let objectivesBlockHtml = '';
  if (rawObjectives.trim()) {
    const lines = rawObjectives.split('\n').map((l: string) => l.trim()).filter(Boolean);
    objectivesBlockHtml = lines.map((line: string) => `<p style="margin:0 0 3px 18px;text-align:justify;">${line}</p>`).join('');
  } else {
    objectivesBlockHtml = `
    <p style="margin:0 0 3px 18px;text-align:justify;">(क) सूचना प्रविधि (IT), सफ्टवेयर विकास, वेब पोर्टल निर्माण, कम्प्युटर प्रणाली व्यवस्थापन तथा परामर्श सेवा प्रदान गर्ने ।</p>
    <p style="margin:0 0 3px 18px;text-align:justify;">(ख) अनलाइन सेवा, डिजिटल मार्केटिङ, डेटा प्रोसेसिङ तथा ई-कमर्स सम्बन्धी सम्पूर्ण सेवाहरू सञ्चालन गर्ने ।</p>
    <p style="margin:0 0 3px 18px;text-align:justify;">(ग) प्रचलित नेपाल कानुन बमोजिम सम्बन्धित निकायको अनुमति लिई अन्य व्यावसायिक तथा प्राविधिक सेवाहरू सञ्चालन गर्ने ।</p>`;
  }

  // 6. Iti Sambat Date
  const defaultIti = getCurrentNepaliItiDate();
  const itiYear  = formData['iti.year']  || defaultIti.yearNp;
  const itiMonth = formData['iti.month'] || defaultIti.monthNp;
  const itiDay   = formData['iti.day']   || defaultIti.dayNp;
  const itiRoaj  = formData['iti.roaj']  || defaultIti.rojNp;

  // 7. Masaudakar (Advocate / Legal Drafter) — Dynamic from form, fallback to dots
  let rawMName = (formData['masaudakar.name'] || formData['advocate.name'] || formData['masaudakar_name'] || '').trim();
  let rawMReg  = (formData['masaudakar.reg_no'] || formData['advocate.reg_no'] || formData['masaudakar_reg_no'] || '').trim();

  // Strip prefixes if user typed them into input
  rawMName = rawMName.replace(/^(अधिवक्ता|advocate)\s*[:.-]?\s*/i, '').trim();
  rawMReg  = rawMReg.replace(/^(प्र\.?प\.?नं\.?|प्र\.?नं\.?|licence|license|reg\.?\s*no\.?)\s*[:.-]?\s*/i, '').trim();

  const mNameDisplay = rawMName ? `<b>${rawMName}</b>` : '.................................';
  const mRegDisplay  = rawMReg  ? `<b>${toNepaliDigits(rawMReg)}</b>` : '.................................';

  // Masaudakar + Iti Sambat wrapped in single table with page-break-inside: avoid
  const masaudakarBlockHtml = `
  <table style="width:100%;border:none;border-collapse:collapse;margin-top:14px;page-break-inside:avoid;break-inside:avoid;">
    <tr>
      <td style="border:none;padding:0;vertical-align:top;line-height:1.6;font-size:13px;">
        <div><b>मसौदाकार:</b></div>
        <div>अधिवक्ता: ${mNameDisplay}</div>
        <div>प्र.प.नं.: ${mRegDisplay}</div>
        <div style="margin-top:2px;">सही: ..................................</div>
        <div style="margin-top:10px;">
          ईति सम्वत <b>${itiYear}</b> साल <b>${itiMonth}</b> महिना <b>${itiDay}</b> गते रोज <b>${itiRoaj}</b> शुभम् .................................।
        </div>
      </td>
    </tr>
  </table>`;

  // 8. Dynamic Promoter Table
  const promoterRowsHtml = shareholders.map((s) => `
    <tr style="page-break-inside:avoid;break-inside:avoid;">
      <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.4;">
        ${toNepaliDigits(s.index)}. नाम: <b>${s.name}</b><br/>
        ठेगाना: ${s.address}<br/>
        ना.नं.: <b>${s.citizenshipNo}</b><br/>
        <div style="margin-top:6px;font-size:11px;"><b>दस्तखत:</b></div>
        <div style="height:28px;"></div>
        <table style="width:100%;border:none;margin-top:4px;">
          <tr>
            <td style="width:50%;border:none;padding:0;text-align:left;font-size:11px;"><b>दायाँ (दा.)</b></td>
            <td style="width:50%;border:none;padding:0;text-align:right;font-size:11px;"><b>बायाँ (बा.)</b></td>
          </tr>
          <tr>
            <td style="border:none;padding:0;height:40px;"></td>
            <td style="border:none;padding:0;height:40px;"></td>
          </tr>
        </table>
      </td>
      <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.4;">${s.fatherName}</td>
      <td style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.4;">
        ना.प्र.नं.: <b>${s.citizenshipNo}</b><br/><br/>
        जि.प्र.का.: <b>${s.district}</b>
      </td>
      <td style="border:1px solid #374151;padding:7px;text-align:center;vertical-align:top;line-height:1.4;">
        <b>${s.shares}</b><br/>थान
      </td>
      ${s.index === 1 ? `
      <td rowspan="${shareholders.length}" style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.4;">
        नाम: <b>${witnessName}</b><br/>
        ठेगाना: ${witnessAddrNp}<br/>
        ना.नं.: <b>${parsedWitnessCit.citizenshipNo}</b><br/>
        <div style="margin-top:6px;font-size:11px;"><b>दस्तखत:</b></div>
        <div style="height:28px;"></div>
        <table style="width:100%;border:none;margin-top:4px;">
          <tr>
            <td style="width:50%;border:none;padding:0;text-align:left;font-size:11px;"><b>दायाँ (दा.)</b></td>
            <td style="width:50%;border:none;padding:0;text-align:right;font-size:11px;"><b>बायाँ (बा.)</b></td>
          </tr>
          <tr>
            <td style="border:none;padding:0;height:40px;"></td>
            <td style="border:none;padding:0;height:40px;"></td>
          </tr>
        </table>
      </td>
      <td rowspan="${shareholders.length}" style="border:1px solid #374151;padding:7px;vertical-align:top;line-height:1.4;">
        ना.प्र.नं.: <b>${parsedWitnessCit.citizenshipNo}</b><br/><br/>
        जि.प्र.का.: <b>${parsedWitnessCit.district}</b>
      </td>` : ''}
    </tr>
  `).join('');

  const promoterTableHtml = `
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;page-break-inside:auto;">
    <thead>
      <tr style="background:#f8fafc;page-break-inside:avoid;break-inside:avoid;">
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;width:24%;">संस्थापकको नाम, ठेगाना र सहिछाप :</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;width:15%;">बाबु/<br/>पतिको नाम</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;width:17%;">नागरिकता प्रमाणपत्र नं. र नागरिकता प्राप्त गरेको जिल्ला</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;width:12%;">लिन कबुल गरेको शेयर संख्या</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;width:18%;">साक्षीको नाम, थर, ठेगाना र सहिछाप :</th>
        <th style="border:1px solid #374151;padding:6px 4px;text-align:center;font-weight:bold;width:14%;">साक्षीको नागरिकताको प्रमाणपत्र नं. र जिल्ला :</th>
      </tr>
    </thead>
    <tbody>
      ${promoterRowsHtml}
    </tbody>
  </table>`;

  // 9. Full Official 16-Clause MOA Body
  const official16ClauseBody = `
<!-- Official Header -->
<div style="text-align: center; margin-bottom: 14px;">
  <div style="font-size: 13.5px; font-weight: bold;"><b>दफा १८ को उपदफा (६) सँग सम्बन्धित</b></div>
  <div style="font-size: 13.5px; font-weight: bold; margin-top: 2px;"><b>कम्पनी ऐन, २०६३ अन्तर्गत संस्थापित</b></div>
  <div style="margin-top: 6px; font-size: 21px; font-weight: bold;"><b>${nameNp}</b></div>
  <div style="font-size: 16px; font-weight: bold; margin-top: 2px; font-family: 'Times New Roman', times, serif;"><b>${nameEn}</b></div>
  <div style="font-size: 16px; font-weight: bold; margin-top: 4px;"><b>प्रबन्ध पत्र</b></div>
  <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-top: 3px; letter-spacing: 1.2px; font-family: 'Times New Roman', times, serif;"><b>MEMORANDUM OF ASSOCIATION</b></div>
</div>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>१. कम्पनीको नाम :</b> यस कम्पनीको नाम <b>${nameNp}</b> हुनेछ । अंग्रेजीमा <b>${nameEn}</b> हुनेछ ।</p>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>२. कम्पनीको रजिष्टर्ड कार्यालय रहने ठेगाना :</b> यस कम्पनीको रजिष्टर्ड कार्यालय <b>${addressNp}</b> मा रहनेछ । आवश्यकता अनुसार सम्बन्धित निकायको स्वीकृती लिई नेपाल राज्यभर जुनसुकै ठाउँमा पनि रजिष्टर्ड कार्यालय स्थानान्तरण गर्न सकिनेछ ।</p>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>३. कम्पनीले गर्ने व्यवसाय वा कारोबारको प्रकृति:-</b> यस कम्पनीले गर्ने व्यवसाय वा कारोबार <b>${businessNature}</b> प्रकृतिको हुनेछ ।</p>

<div style="margin:0 0 6px 0;line-height:1.6;">
  <p style="margin:0 0 4px 0;"><b>४. कम्पनीको उद्देश्य:-</b> १. यस कम्पनीका उद्देश्य देहाय वमोजिम हुनेछन्:</p>
  ${objectivesBlockHtml}
  <p style="margin:4px 0 3px 18px;text-align:justify;">२. उपदफा (१) वमोजिमका उद्देश्य प्रचलित कानून वमोजिम सम्बन्धित निकायबाट अनुमति वा इजाजत प्राप्त गर्नु पर्ने भएमा सो प्राप्त गरी मात्र कार्यान्वयन गरिनेछ ।</p>
  <p style="margin:0 0 6px 18px;text-align:justify;">३. उपदफा (१) मा उल्लेखित उद्देश्यको सम्बन्धमा अनुमति वा इजाजत प्राप्त गरेको १५ दिन भित्र त्यस्तो अनुमति वा इजाजत पत्रको प्रतिलिपि कार्यालयमा पेश गरिनेछ ।</p>
</div>

<div style="margin:0 0 6px 0;line-height:1.6;">
  <p style="margin:0 0 4px 0;"><b>५. कम्पनीको उद्देश्य प्राप्ति गर्न गरिने कामहरु:</b></p>
  <p style="margin:0 0 3px 18px;">(१) यस कम्पनीले दफा ३ वमोजिमका उद्देश्य प्राप्त गर्न देहायका कामहरु गर्नेछ:</p>
  <p style="margin:0 0 3px 24px;text-align:justify;">(क) कम्पनीलाई आवश्यक पर्ने घर, जग्गा, भवन, सवारी साधन र आवश्यक कम्प्युटर, टेलिफोन, फ्याक्स, इमेल, इन्टररनेट, वेब साइट आदि उपकरणहरु खरिद-बिक्री गर्ने वा भाडामा लिई प्रयोग गर्ने वा आवश्यकता अनुसार निर्माण गर्ने ।</p>
  <p style="margin:0 0 3px 24px;text-align:justify;">(ख) कम्पनीलाई आवश्यक पर्ने कर्मचारी नियुक्ति गर्ने तथा तिनको सेवाका सर्तहरु निर्धारण गर्ने,</p>
  <p style="margin:0 0 3px 24px;text-align:justify;">(ग) कम्पनीको नाममा बैंक तथा वित्तीय संस्थामा खाता खोल्ने र सञ्चालन गर्ने,</p>
  <p style="margin:0 0 3px 24px;text-align:justify;">(घ) कम्पनीलाई आवश्यक पर्ने रकम बैंक वा कुनै वित्तीय संस्थाबाट कम्पनीले धितो राखी वा नराखी कर्जा लिने ।</p>
  <p style="margin:0 0 3px 24px;text-align:justify;">(ङ) कम्पनीको नामबाट शेयर तथा डिभेञ्चर खरिद गर्ने तथा त्यसलाई विक्री गर्ने</p>
  <p style="margin:0 0 3px 24px;font-weight:bold;">(च) अन्य आवश्यक कुराहरु :-</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">१) रोजगारीमा लगाउँदा कामदारहरुलाई नियुक्ति पत्र प्रा.लि.ले दिनेछ ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">२) श्रम ऐन, ऐन नियम अनुसार पाउनुपर्ने सुविधाहरु प्रा.लि. ले उपलब्ध गराउनेछ ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">३) कम्पनीले आवश्यक घर, गोदाम, तथा अन्य चल अचल सम्पत्ति आदि लीज वा भोग बन्धकीमा लिने, निर्माण गर्ने, मर्मत–संभार गर्न सक्नेछ ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">४) कम्पनीलाई आकस्मीक क्षतिबाट बचाउन कम्पनीको मेसिनरी, भवन लगायत सबै प्रकारका सम्पत्तिहरुको आवश्यकतानुसार विमा गराउने ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">५) कम्पनीको नाममा नेपाल अधिराज्यको कुनै पनि वित्तीय सँस्था तथा बैङ्कहरुमा कम्पनीको नाममा खाता खोली रकम जम्मा गर्ने, झिक्ने आदि जारी गर्ने दरपिठ गर्ने भूक्तानि लिने, दिने, एल.सि.खोल्ने, मन्जुर गर्ने यस्तै प्रकारका अन्य आवश्यक कामहरु गर्ने ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">६) कम्पनीको लागी प्राप्त हुन सक्ने सबै प्रकारका सुविधा, सहुलियत प्राप्त गर्न नेपाल सरकारको कार्यालयहरु सँग अनुरोध गर्ने, कम्पनीको व्यापारीक हित संरक्षणको लागि डिजाइन र ट्रेडमार्क दर्ता गराउने, यसको हक र सुविधा उपलब्ध गर्ने, उपयोग गर्ने ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">७) कम्पनीको तर्फबाट वा कम्पनी विरुद्ध परेका मुद्दा मामिलाहरुको पुर्पक्ष गर्ने, प्रतिरक्षा गर्ने, लिखित जवाफ पेश गर्ने यस सम्बन्धमा आवश्यक कानूनी सेवा प्राप्त गरी आफ्नो हक अधिकारको संरक्षण गर्ने, सहुलियत सुविधालाई सुरक्षित राख्ने ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">८) कम्पनीको आफ्नो लक्ष्य र उद्देश्य प्राप्त गर्न विभिन्न संचारका माध्यमहरुबाट विज्ञापन सूचना आदि प्रचार प्रसार गर्ने, गराउने ।</p>
  <p style="margin:0 0 3px 36px;text-align:justify;">९) कम्पनीले आफ्नो नाममा जग्गाहरु खरिद गर्ने एवं धितो बन्धक राख्ने ।</p>
  <p style="margin:0 0 6px 36px;text-align:justify;">१०) प्रचलित कानूनको अधिनमा रही कम्पनीको उद्देश्य पूर्तिका लागि आवश्यक संझौताहरु गर्ने ।</p>
</div>

<div style="margin:0 0 6px 0;line-height:1.6;">
  <p style="margin:0 0 4px 0;"><b>६. कम्पनीको पूँजीको संरचना:-</b> कम्पनीको पूँजीको संरचना देहाय वमोजिम हुनेछः</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(क) कम्पनीको अधिकृत पूँजी रु. <b>${capAuth}</b>/- (<b>${capAuthWords}</b>) हुनेछ । सो पूँजीलाई रु १००/- दरका <b>${totalShares}</b> थान साधारण शेयरमा विभाजन गरिएको छ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(ख) कम्पनीले तत्काल जारी गर्ने शेयर पूँजी रु. <b>${capIssued}</b>/- (<b>${capIssuedWords}</b>) हुनेछ । सो पूँजीलाई रु १००/- दरका <b>${issuedShares}</b> थान साधारण शेयरमा विभाजन गरिएको छ ।</p>
  <p style="margin:0 0 6px 18px;text-align:justify;">(ग) कम्पनीका संस्थापकहरुले तत्काल चुक्ता गर्न कबुल गरेको पूँजी रु. <b>${capPaidUp}</b>/- (<b>${capPaidUpWords}</b>) हुनेछ । सो पूँजीलाई रु १००/- दरका <b>${paidUpShares}</b> थान साधारण शेयरमा विभाजन गरिएको छ ।</p>
</div>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>७. कम्पनीको शेयरको किसिम:</b> कम्पनीको शेयरको किसिम देहाय वमोजिम हुनेछः<br/>
<span style="margin-left:18px;">(क) यस कम्पनीको साधारण शेयर मात्र जारी गरिनेछ ।</span></p>

<div style="margin:0 0 6px 0;line-height:1.6;">
  <p style="margin:0 0 4px 0;"><b>८. शेयर खरिद वा हस्तान्तरण गर्न कुनै बन्देज रहेको भए सो कुरा:</b></p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(क) कम्पनीको प्रबन्ध पत्र तथा नियमावलीमा हस्ताक्षर गर्ने संस्थापक शेयर धनीले कम्पनीको प्रथम वार्षिक साधारण सभा नभएसम्म र निजको नाममा जारी भएको शेयरको कम्पनीबाट माग भएको मुल्य पूर्णरुपमा चुक्ता नभएसम्म आफूले लिएको शेयर विक्री वितरण वा दान दातव्य वा कुनै पनि किसिमबाट हक छाडी दिन र धितो बन्धक राख्न पाइने छैन ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(ख) शेयर हक बेहकको सम्बन्धमा कुनै उजुर वाजुर गरेमा अदालतको निर्णयअनुसार नै हुनेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(ग) मगज बिग्रेको व्यक्तिको नाममा शेयर नामसारी गर्न सकिने छैन ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(घ) यो कम्पनी प्रा.लि. भएको हुँदा यस कम्पनीको शेयर सर्वसाधारणको लागि खरिद तथा विक्रीको लागि आव्हान गरिने छैन ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(ङ) शेयर हस्तान्तरण वा धितो वन्धक राख्न संचालक समितिको पूर्वस्वीकृति लिनु पर्नेछ स्वीकृति बिना गरिएको शेयर हस्तान्तरण संचालक समितिले वदर गर्न सकिनेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(च) कम्पनीको बाँकी रहेको शेयर संचालक समितिको निर्णय वमोजिम कुनै व्यक्ति वा कम्पनीलाई विक्री गर्न वा शेयरवाला आफैले लिन सक्नेछ ।</p>
  <p style="margin:0 0 6px 18px;text-align:justify;">(छ) शेयरवालाको मृत्यु भई वा मगज बिग्री वा बेपत्ता भई हकवालामा शेयर हस्तान्तरण भएको अवस्थामा भन्दा बाहेक शेयरको नामसारी गर्नु परेमा नामसारी गरिलिने दिने दुवै व्यक्तिको वतन सहितको सहिछाप नामसारीको लिखतमा हुनुपर्नेछ र नामसारी गरी लिने व्यक्तिको नाम दर्ता किताबमा नचढेसम्म नामसारी गरिदिने व्यक्तिलाई नै उक्त शेयरको शेयरधनी मानिनेछ ।</p>
</div>

<div style="margin:0 0 6px 0;line-height:1.6;">
  <p style="margin:0 0 4px 0;"><b>९. शेयर वापतको रकम भुक्तानीका शर्तहरु:</b></p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(१) कम्पनीले आफ्नो आवश्यकता अनुसार संचालक समितिको बैठकबाट निर्णय गरी शेयर वापतको रकम आंशिक वा पूर्ण रुपले भुक्तानी माग गर्न सक्नेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(२) शेयरवापत कम्पनीले माग गरेका रकमहरु निर्धारित समयमा शेयरधनीले बुझाउनु पर्नेछ ।</p>
  <p style="margin:0 0 6px 18px;text-align:justify;">(३) शेयर वापतको रकम माग गर्ने, माग गरेको रकम निर्धारित समयावधि भित्र बुझाउने भुक्तानीको म्याद थप माग गर्ने तथा कम्पनीले म्याद दिने जस्ता कुराहरु नियमावलीमा उल्लेख भए वमोजिम हुनेछ ।</p>
</div>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>१०. शेयर धनीको अधिकतम संख्या:</b> शेयरधनीहरुको अधिकतम संख्या <b>${isSingleShareholder ? 'एक जना सम्म हुनेछ' : 'एक सय एक जना सम्म हुनेछ'}</b> ।</p>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>११. दायित्व सिमित हुने:</b> यस कम्पनीको कारोबारको सम्बन्धमा शेयरधनीको दायित्व निजले खरिद गरेको वा खरिद गर्न लिन कबुल गरेको शेयरको अंकित मूल्य सम्म सिमित रहनेछ । तर कुनै शेयर धनी वा संचालकले सो हैसियतमा तेश्रो पक्षसँग गरेको व्यक्तिगत जमानत सम्बन्धी सम्झौता बमोजिमको दायित्वको हकमा यो व्यवस्था लागु हुनेछैन ।</p>

<div style="margin:0 0 6px 0;line-height:1.6;">
  <p style="margin:0 0 4px 0;"><b>१२. अन्य आवश्यक कुराहरु:</b></p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(१) कम्पनीको संस्थापना गर्दा लागेको खर्च कम्पनीले नै व्यहोर्ने छ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(२) संचालक समितिले निर्णय गरी संस्थापक वा अन्य कुनै व्यक्तिहरुले नगद रुपैया बाहेक अन्य जग्गा जमिन लगायत अन्य कुनै किसिमबाट शेयर खरिदगर्न वा शेयरमा हकपाउन सक्नेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(३) कम्पनीको काम शुरु गर्दाको अवस्थामा संस्थापक वा अन्य कुनै व्यक्तिबाट कम्पनीले कुनै किसिमले कुनै सम्पत्ति प्राप्त गर्ने कुरामा संचालक समितिको निर्णयवमोजिम हुनेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(४) संस्थापक वा अन्य कुनै व्यक्तिले कम्पनीबाट कुनै विशेष सहुलियत वा अधिकार पाउने कुराको हकमा संचालक समितिको निर्णय बमोजिम हुनेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(५) कम्पनी ऐन, २०६३ को अधिनमा रही अन्य आवश्यक कुराहरु साधारण सभाले समय समयमा निर्धारण गरे वमोजिम हुनेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(६) कम्पनीको एउटा छुट्टै छाप हुनेछ र कम्पनीको तर्फबाट तयार पारिने कुनै पनि कागजातमा सोही छापले प्रमाणित गरी राखिनेछ ।</p>
  <p style="margin:0 0 3px 18px;text-align:justify;">(७) कुनै व्यक्तिले कम्पनीलाई सम्पत्ति उपलब्ध गराएमा सो को मूल्य बराबरको शेयर दिन सकिनेछ । अर्थात नगद बाहेक पनि कम्पनीको शेयर प्राप्त गर्न सकिनेछ ।</p>
  <p style="margin:0 0 6px 18px;text-align:justify;">(८) कम्पनी ऐन, २०६३ अधिनमा रही कम्पनीको साधारण सभामा विशेष प्रस्ताव पास गरी कार्यालयको स्वीकृति लिई कम्पनीको पूँजी बढाउन वा घटाउन सकिनेछ ।</p>
</div>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>१३. कम्पनीको प्रकृति अनुसार कुनै थप व्यवस्था गर्ने भए सो कुरा खुलाउने:</b><br/>
<span style="margin-left:18px;">यस कम्पनीको प्रकृति अनुसार कुनै थप व्यवस्था गरिएको छैन तर कम्पनीले आफ्नो प्रकृति अनुसार कुनै थप व्यवस्था गर्न आवश्यक ठानेमा साधारण सभाबाट विशेष प्रस्ताव पारित गरि सो प्रस्ताव वा निर्णय कार्यालयबाट अभिलेख भएपछि मात्र थप व्यवस्था लागू गर्न सकिनेछ ।</span></p>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>१४. प्रबन्धपत्रमा संशोधन भएमा लागु हुने अवस्था:</b> यस प्रवन्ध पत्रमा कम्पनीले कुनै संशोधन गर्नु पर्ने भएमा साधारण सभाबाट विशेष प्रस्ताव पारित गरि सो प्रस्ताव वा निर्णय कार्यालयबाट अभिलेख भएपछि मात्र प्रबन्ध पत्र संशोधन भएको मानिनेछ ।</p>

<p style="margin:0 0 6px 0;line-height:1.6;text-align:justify;"><b>१५. प्रबन्धपत्र बाझिएको हदसम्म अमान्यहुने:</b> यस प्रवन्धपत्रमा लेखिएको कुरा कम्पनी ऐन, २०६३ वा अन्य प्रचलित कानुनसँग बाझिएमा बाझिएको हदसम्म स्वतः बदर हुनेछ ।</p>

<div style="margin:0 0 10px 0;line-height:1.6;">
  <p style="margin:0 0 6px 0;text-align:justify;"><b>१६. संस्थापकहरुले तत्काल लिन कबुल गरेको शेयर संख्या:</b> ${
    isSingleShareholder
      ? `म <b>${nameNp}</b> को संस्थापकले यो कम्पनी संस्थापना गरी प्रचलित कानुन बमोजिम सञ्चालन गर्न मञ्जुर गरेको छु । यो प्रबन्धपत्रमा उल्लेखित मेरो नाम, ठेगाना, हस्ताक्षर, मैले लिन कबुल गरेको शेयर र साक्षी सम्बन्धी व्यहोरा ठीक साँचो हो । कुनै कारणले झुट्टा ठहरिन गएमा कम्पनी दर्ता पश्चात् सिर्जना हुने दायित्व व्यहोर्न म तयार छु । यो प्रबन्धपत्रमा लेखिएका कुरा साँचो हो, झुट्टा ठहरे कानुन बमोजिम सहन बुझाउन मञ्जुर छु भनी सहीछाप गरेको छु ।`
      : `हामी <b>${nameNp}</b> का संस्थापकहरुले यो कम्पनी संस्थापना गरी प्रचलित कानून बमोजिम सञ्चालन गर्न मञ्जुर गरेका छौं । यो प्रबन्धपत्रमा उल्लेखित हाम्रो नाम, ठेगाना, हस्ताक्षर, हामीले लिन कबुल गरेको शेयर र साक्षी सम्बन्धी व्यहोरा ठीक साँचो हो । कुनै कारणले भुठ्ठा ठहरिन गएमा कम्पनी दर्ता पश्चात् सिर्जना हुने दायित्व व्यहोर्न हामी तयार छौं । यो प्रबन्धपत्रमा लेखिएका कुरा साँचो हो, झुठ्ठा ठहरे कानून वमोजिम सहन बुझाउन मञ्जुर छौं भनी सहिछाप गरेका छौं ।`
  }</p>
</div>

<!-- Dynamic Promoter Table -->
${promoterTableHtml}

<!-- Advocate & Iti Sambat -->
${masaudakarBlockHtml}
`;

  // 10. Wrap in standardized A4 styling
  return `
  <!-- Full MOA — 16-Clause Official Format (Single & Multi-Shareholder) -->
  <div class="a4-sheet" style="font-size: 13px; line-height: 1.55; letter-spacing: 0.25px; font-family: 'kalimati', serif;">
    <div class="doc-content">
      ${official16ClauseBody}
    </div>
  </div>`;
}
