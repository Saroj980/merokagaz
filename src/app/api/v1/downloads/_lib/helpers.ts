/** Helper functions and error page generators */

import type { DocLayout, LayoutFlags, OrderData } from './types';

// ─── Nepali South Asian Number Formatter (e.g. ५०,००,०००) ───────────────────
export function formatNepaliNumber(val: number | string): string {
  if (val === undefined || val === null || val === '') return '';
  const devanagariToAscii: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const str = String(val).trim();
  const asciiStr = str.replace(/[०-९]/g, (d) => devanagariToAscii[d] || d);

  // If it contains commas, remove them first
  const cleanNumStr = asciiStr.replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleanNumStr)) {
    return toDevanagariDigits(str);
  }

  const [intPart, decPart] = cleanNumStr.split('.');
  let formattedInt = '';
  if (intPart.length <= 3) {
    formattedInt = intPart;
  } else {
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups: string[] = [];
    let cur = remaining;
    while (cur.length > 2) {
      groups.unshift(cur.slice(-2));
      cur = cur.slice(0, -2);
    }
    if (cur.length > 0) {
      groups.unshift(cur);
    }
    formattedInt = groups.join(',') + ',' + lastThree;
  }

  const fullAscii = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  return toDevanagariDigits(fullAscii);
}

// ─── Placeholder replacer ───────────────────────────────────────────────────
export function makePlaceholderReplacer(formData: Record<string, string>) {
  return function replacePlaceholders(text: string): string {
    if (!text) return '';
    return text.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (_match, key) => {
      let val = (formData[key] || '').trim();
      if (!val) return '____________________';

      // Exclude phone, mobile, citizenship, PAN, registration, and other ID keys from comma formatting
      const isIdentifierOrPhone = /(phone|mobile|tel|contact|citizenship|pan|vat|reg|registration|po_box|fax|nid|passport|token|serial)/i.test(key);
      const isNumericKey = /(capital|shares|share_rate|unpaid|amount|fee|count|rate|total_shares|issued_shares|price|total)/i.test(key);
      const isPureDigits = /^[0-9०-९,]+(\.[0-9०-९]+)?$/.test(val);

      if (!isIdentifierOrPhone) {
        if (isNumericKey || isPureDigits) {
          val = formatNepaliNumber(val);
        }
      } else {
        // Convert digits to Nepali script without adding commas
        val = toDevanagariDigits(val.replace(/,/g, ''));
      }

      return `<b>${val}</b>`;
    });
  };
}

// ─── Body paragraph renderer ────────────────────────────────────────────────
export function renderBodyParagraphs(text: string, replaceFn: (t: string) => string): string {
  return replaceFn(text)
    .split('\n\n')
    .map((p) => `<p style="margin-bottom: 14px; line-height: 1.8; text-align: justify;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

// ─── Layout flags resolver ───────────────────────────────────────────────────
export function resolveLayoutFlags(docLayout: DocLayout | null): LayoutFlags {
  const isPlainPreprinted = docLayout?.paperMode === 'plain_preprinted';
  const isLegalDeed = docLayout?.paperMode === 'legal_deed';

  return {
    isPlainPreprinted,
    isLegalDeed,
    showHeader: docLayout?.showHeader !== undefined
      ? Boolean(docLayout.showHeader) && !isPlainPreprinted
      : true,
    showFooter: docLayout?.showFooter !== undefined
      ? Boolean(docLayout.showFooter)
      : true,
    showDateRef: docLayout?.showDateRef !== undefined
      ? Boolean(docLayout.showDateRef)
      : true,
    showWatermark: Boolean(docLayout?.showWatermark) && !isPlainPreprinted,
    showEmblem: Boolean(docLayout?.showEmblem),
    topMargin: isPlainPreprinted
      ? (docLayout?.topMarginMm || 50)
      : (docLayout?.topMarginMm || 10),
    bottomMargin: docLayout?.bottomMarginMm || 8,
  };
}

import NepaliDate from 'nepali-date-converter';

const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

const NEPALI_DAYS = [
  'आइतवार', 'सोमवार', 'मङ्गलवार', 'बुधवार', 'बिहिवार', 'शुक्रवार', 'शनिवार'
];

export function toDevanagariDigits(num: number | string): string {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/\d/g, (d) => devanagariDigits[parseInt(d, 10)]);
}

export function toNepaliAddress(address: string): string {
  if (!address || !address.trim()) return '.....................';

  let res = address;

  // 1. Provinces
  const provinceMap: Record<string, string> = {
    'sudurpashchim pradesh': 'सुदूरपश्चिम प्रदेश',
    'sudurpaschim pradesh': 'सुदूरपश्चिम प्रदेश',
    'sudurpashchim province': 'सुदूरपश्चिम प्रदेश',
    'sudurpaschim province': 'सुदूरपश्चिम प्रदेश',
    'sudurpashchim': 'सुदूरपश्चिम प्रदेश',
    'sudurpaschim': 'सुदूरपश्चिम प्रदेश',
    'koshi pradesh': 'कोशी प्रदेश',
    'koshi province': 'कोशी प्रदेश',
    'madhesh pradesh': 'मधेश प्रदेश',
    'madhesh province': 'मधेश प्रदेश',
    'bagmati pradesh': 'बागमती प्रदेश',
    'bagmati province': 'बागमती प्रदेश',
    'gandaki pradesh': 'गण्डकी प्रदेश',
    'gandaki province': 'गण्डकी प्रदेश',
    'lumbini pradesh': 'लुम्बिनी प्रदेश',
    'lumbini province': 'लुम्बिनी प्रदेश',
    'karnali pradesh': 'कर्णाली प्रदेश',
    'karnali province': 'कर्णाली प्रदेश',
    'pradesh': 'प्रदेश',
    'province': 'प्रदेश',
  };

  // 2. Local Level Types
  const typeMap: Record<string, string> = {
    'sub-metropolitan city': 'उपमहानगरपालिका',
    'sub metropolitan city': 'उपमहानगरपालिका',
    'sub-metropolitan': 'उपमहानगरपालिका',
    'metropolitan city': 'महानगरपालिका',
    'rural municipality': 'गाउँपालिका',
    'municipality': 'नगरपालिका',
    'ward no.': 'वडा नं.',
    'ward no': 'वडा नं.',
    'ward': 'वडा नं.',
    'w.n.': 'वडा नं.',
  };

  // 3. District & City Names
  const districtCityMap: Record<string, string> = {
    'dhangadhi': 'धनगढी',
    'kailali': 'कैलाली',
    'kathmandu': 'काठमाडौँ',
    'lalitpur': 'ललितपुर',
    'bhaktapur': 'भक्तपुर',
    'pokhara': 'पोखरा',
    'kaski': 'कास्की',
    'biratnagar': 'विराटनगर',
    'morang': 'मोरङ',
    'birgunj': 'वीरगञ्ज',
    'parsa': 'पर्सा',
    'bharatpur': 'भरतपुर',
    'chitwan': 'चितवन',
    'butwal': 'बुटवल',
    'rupandehi': 'रुपन्देही',
    'hetauda': 'हेटौँडा',
    'makwanpur': 'मकवानपुर',
    'nepalgunj': 'नेपालगञ्ज',
    'banke': 'बाँके',
    'dharan': 'धरान',
    'itahari': 'इटहरी',
    'sunsari': 'सुनसरी',
    'jhapa': 'झापा',
    'birtamod': 'बिर्तामोड',
    'damak': 'दमक',
    'janakpur': 'जनकपुरधाम',
    'dhanusha': 'धनुषा',
    'surkhet': 'सुर्खेत',
    'birendranagar': 'वीरेन्द्रनगर',
    'kanchanpur': 'कञ्चनपुर',
    'bhimdatta': 'भीमदत्त',
    'tikapur': 'टीकापुर',
    'godawari': 'गोदावरी',
    'tulsipur': 'तुलसीपुर',
    'ghorahi': 'घोराही',
    'dang': 'दाङ',
    'bardiya': 'बर्दिया',
    'palpa': 'पाल्पा',
    'tansen': 'तानसेन',
    'nawalparasi': 'नवलपरासी',
    'nawalpur': 'नवलपुर',
    'parasi': 'परासी',
    'tanahun': 'तनहुँ',
    'syangja': 'स्याङ्जा',
    'gorkha': 'गोरखा',
    'lamjung': 'लमजुङ',
    'baglung': 'बागलुङ',
    'parbat': 'पर्वत',
    'myagdi': 'म्याग्दी',
    'gulmi': 'गुल्मी',
    'arghakhanchi': 'अर्घाखाँची',
    'kapilvastu': 'कपिलवस्तु',
    'pyuthan': 'प्युठान',
    'rolpa': 'रोल्पा',
    'salyan': 'सल्यान',
    'rukum': 'रुकुम',
    'dailekh': 'दैलेख',
    'jajarkot': 'जाजरकोट',
    'jumla': 'जुम्ला',
    'kalikot': 'कालिकोट',
    'humla': 'हुम्ला',
    'mugu': 'मुगु',
    'dolpa': 'डोल्पा',
    'bajura': 'बाजुरा',
    'bajhang': 'बझाङ',
    'achham': 'अछाम',
    'doti': 'डोटी',
    'dadeldhura': 'डडेलधुरा',
    'baitadi': 'बैतडी',
    'darchula': 'दार्चुला',
    'ilam': 'इलाम',
    'panchthar': 'पाँचथर',
    'taplejung': 'ताप्लेजुङ',
    'terhathum': 'तेह्रथुम',
    'sankhuwasabha': 'संखुवासभा',
    'bhojpur': 'भोजपुर',
    'dhankuta': 'धनकुटा',
    'solukhumbu': 'सोलुखुम्बु',
    'okhaldhunga': 'ओखलढुङ्गा',
    'khotang': 'खोटाङ',
    'udayapur': 'उदयपुर',
    'saptari': 'सप्तरी',
    'siraha': 'सिराहा',
    'sarlahi': 'सर्लाही',
    'mahottari': 'महोत्तरी',
    'rautahat': 'रौतहट',
    'bara': 'बारा',
    'nuwakot': 'नुवाकोट',
    'dhading': 'धादिङ',
    'kavrepalanchok': 'काभ्रेपलाञ्चोक',
    'kavre': 'काभ्रेपलाञ्चोक',
    'sindhupalchok': 'सिन्धुपाल्चोक',
    'dolakha': 'दोलखा',
    'ramechhap': 'रामेछाप',
    'sindhuli': 'सिन्धुली',
    'rasuwa': 'रसुवा',
    'mustang': 'मुस्ताङ',
    'manang': 'मनाङ',
  };

  const replaceCaseInsensitive = (str: string, map: Record<string, string>) => {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      str = str.replace(regex, map[key]);
    }
    return str;
  };

  res = replaceCaseInsensitive(res, provinceMap);
  res = replaceCaseInsensitive(res, typeMap);
  res = replaceCaseInsensitive(res, districtCityMap);

  // Convert digits to Nepali devanagari
  res = toDevanagariDigits(res);

  // Clean up any double spaces or dangling formatting
  res = res.replace(/\s+/g, ' ').trim();

  return res;
}

export function getCurrentNepaliItiDate(dateInput?: string | Date) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const bs = new NepaliDate(isNaN(d.getTime()) ? new Date() : d);
  const yearNp = toDevanagariDigits(bs.getYear());
  const monthNp = NEPALI_MONTHS[bs.getMonth()] || 'आश्विन';
  const dayNp = toDevanagariDigits(bs.getDate());
  const dayIndex = bs.getDay(); // 0 = Sunday, 5 = Friday
  const dayNameNp = NEPALI_DAYS[dayIndex] || 'शुक्रवार';
  const rojNp = toDevanagariDigits(dayIndex + 1); // 1 = Sunday, 6 = Friday

  const now = new Date();
  const hh = toDevanagariDigits(String(now.getHours()).padStart(2, '0'));
  const mm = toDevanagariDigits(String(now.getMinutes()).padStart(2, '0'));
  const timeNp = `${hh}:${mm}`;

  return {
    yearNp,
    monthNp,
    dayNp,
    rojNp,
    dayNameNp,
    timeNp,
    fullText: `ईति सम्वत् ${yearNp} साल ${monthNp} महिना ${dayNp} गते रोज ${rojNp} (${dayNameNp}) शुभम् (समय: ${timeNp})`,
  };
}

// ─── Nepali Bikram Sambat (BS) date formatter (YYYY-MM-DD) ────────────────────
export function formatOrderDate(createdAt: string): string {
  try {
    const d = createdAt ? new Date(createdAt) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const bs = new NepaliDate(validDate);
    const yearNp = toDevanagariDigits(bs.getYear());
    const monthNp = toDevanagariDigits(String(bs.getMonth() + 1).padStart(2, '0'));
    const dayNp = toDevanagariDigits(String(bs.getDate()).padStart(2, '0'));
    return `${yearNp}-${monthNp}-${dayNp}`;
  } catch {
    return new Date().toLocaleDateString('ne-NP');
  }
}

// ─── Error Pages ─────────────────────────────────────────────────────────────
export function missingTokenPage(): Response {
  return new Response(
    `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>अर्डर वा डाउनलोड टोकन फेला परेन (Order or Download Token Missing)</h2>
      <p>कृपया चेकआउट पेजबाट पुनः प्रयास गर्नुहोस्।</p>
    </body></html>`,
    { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export function orderNotFoundPage(): Response {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>कागजात फेला परेन - Mero Kagaz</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; }
          .card { background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #334155; max-width: 440px; }
          h2 { color: #f43f5e; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; }
          a { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #18a999; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>कागजात फेला परेन (Order Not Found)</h2>
          <p>तपाईंले अनुरोध गर्नुभएको अर्डर वा टोकन प्रणालीमा दर्ता छैन वा म्याद सकिएको छ।</p>
          <a href="/">गृहपृष्ठमा जानुहोस् (Return Home)</a>
        </div>
      </body>
    </html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
