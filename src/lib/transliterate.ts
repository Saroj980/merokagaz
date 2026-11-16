/**
 * Romanized English to Nepali Unicode Transliteration Engine
 * Converts phonetic English typing (e.g. 'ram', 'nepal', 'shrestha') into standard Nepali Unicode.
 */

const SPECIAL_WORDS: Record<string, string> = {
  // Common Names
  ram: 'राम',
  raam: 'राम',
  shyam: 'श्याम',
  sita: 'सीता',
  seeta: 'सीता',
  gita: 'गीता',
  geeta: 'गीता',
  hari: 'हरि',
  krishna: 'कृष्ण',
  shiva: 'शिव',
  bishnu: 'विष्णु',
  vishnu: 'विष्णु',
  ganesh: 'गणेश',
  laxmi: 'लक्ष्मी',
  lakshmi: 'लक्ष्मी',
  saraswati: 'सरस्वती',
  raj: 'राज',
  raja: 'राजा',
  maya: 'माया',
  prem: 'प्रेम',
  santosh: 'सन्तोष',
  kiran: 'किरण',
  sunil: 'सुनील',
  anil: 'अनिल',
  dipak: 'दीपक',
  deepak: 'दीपक',
  prakash: 'प्रकाश',
  manoj: 'मनोज',
  suraj: 'सुरज',
  binod: 'विनोद',
  vinod: 'विनोद',
  arjun: 'अर्जुन',
  bikash: 'विकास',
  vikash: 'विकास',
  nabin: 'नवीन',
  navin: 'नवीन',
  rohan: 'रोहन',
  rohit: 'रोहित',
  amit: 'अमित',
  suman: 'सुमन',
  sushil: 'सुशील',
  bimal: 'विमल',
  vimal: 'विमल',
  kamal: 'कमल',
  mohan: 'मोहन',
  sohan: 'सोहन',
  sandesh: 'सन्देश',
  anup: 'अनुप',
  subash: 'सुवास',
  subhash: 'सुभाष',
  bharat: 'भरत',
  mahesh: 'महेश',
  dinesh: 'दिनेश',
  umesh: 'उमेश',
  suresh: 'सुरेश',
  naresh: 'नरेश',
  keshab: 'केशव',
  keshav: 'केशव',
  madhav: 'माधव',
  govinda: 'गोविन्द',
  dhan: 'धन',
  lal: 'लाल',
  mani: 'मणि',
  ratna: 'रत्न',
  bahadur: 'बहादुर',
  bdr: 'बहादुर',
  kumar: 'कुमार',
  kumari: 'कुमारी',
  prasad: 'प्रसाद',
  devi: 'देवी',

  // Surnames
  shrestha: 'श्रेष्ठ',
  thapa: 'थापा',
  magar: 'मगर',
  gurung: 'गुरुङ',
  tamang: 'तामाङ',
  rai: 'राई',
  limbu: 'लिम्बु',
  sherpa: 'शेर्पा',
  newar: 'नेवार',
  yadav: 'यादव',
  shah: 'शाह',
  shahi: 'शाही',
  singh: 'सिंह',
  adhikari: 'अधिकारी',
  karki: 'कार्की',
  bhattarai: 'भट्टराई',
  sharma: 'शर्मा',
  acharya: 'आचार्य',
  pandey: 'पाण्डेय',
  regmi: 'रेग्मी',
  paudel: 'पौडेल',
  poudel: 'पौडेल',
  koirala: 'कोइराला',
  dahal: 'दाहाल',
  bhandari: 'भण्डारी',
  basnet: 'बस्नेत',
  basnyat: 'बस्न्यात',
  oli: 'ओली',
  kc: 'के.सी.',
  'k.c.': 'के.सी.',
  ghimire: 'घिमिरे',
  pokharel: 'पोखरेल',
  joshi: 'जोशी',
  pant: 'पन्त',
  subedi: 'सुवेदी',
  kamti: 'काम्ती',
  yogesh: 'योगेश',
  sah: 'साह',
  thakur: 'ठाकुर',
  mandal: 'मण्डल',
  jha: 'झा',
  tiwari: 'तिवारी',
  chaudhary: 'चौधरी',
  mahato: 'महतो',
  gupta: 'गुप्त',
  kushwaha: 'कुशवाहा',
  khadka: 'खड्का',
  bista: 'विष्ट',
  rawat: 'रावत',
  bohara: 'बोहरा',
  rokaya: 'रोकाया',
  budha: 'बुढा',
  pun: 'पुन',
  gharti: 'घर्ती',

  // Geographic & Administrative
  nepal: 'नेपाल',
  kathmandu: 'काठमाडौं',
  ktm: 'काठमाडौं',
  lalitpur: 'ललितपुर',
  bhaktapur: 'भक्तपुर',
  pokhara: 'पोखरा',
  dhangadhi: 'धनगढी',
  kailali: 'कैलाली',
  butwal: 'बुटवल',
  dharan: 'धरान',
  biratnagar: 'विराटनगर',
  nepalgunj: 'नेपालगन्ज',
  hetauda: 'हेटौंडा',
  chitwan: 'चितवन',
  jhapa: 'झापा',
  morang: 'मोरङ',
  sunsari: 'सुनसरी',
  kaski: 'कास्की',
  rupandehi: 'रुपन्देही',
  banke: 'बाँके',
  surkhet: 'सुर्खेत',
  kanchanpur: 'कञ्चनपुर',
  ward: 'वडा',
  vada: 'वडा',
  tole: 'टोल',
  tol: 'टोल',
  marga: 'मार्ग',
  marg: 'मार्ग',
  sadak: 'सडक',
  chowk: 'चोक',
  bazar: 'बजार',
  bazaar: 'बजार',
  nagar: 'नगर',
  palika: 'पालिका',
  nagarpalika: 'नगरपालिका',
  gaupalika: 'गाउँपालिका',
  gaunpalika: 'गाउँपालिका',
  mahanagarpalika: 'महानगरपालिका',
  upmahanagarpalika: 'उपमहानगरपालिका',
  jilla: 'जिल्ला',
  pradesh: 'प्रदेश',
  navadurga: 'नवदुर्गा',
  nawadurga: 'नवदुर्गा',
  nabadurga: 'नवदुर्गा',
  durga: 'दुर्गा',
  durg: 'दुर्ग',
  nava: 'नव',
  nawa: 'नव',
  naba: 'नव',
  namaste: 'नमस्ते',
  shree: 'श्री',
  shriman: 'श्रीमान्',
  shrimati: 'श्रीमती',
  buwa: 'बुवा',
  aama: 'आमा',
  chhora: 'छोरा',
  chhori: 'छोरी',
  pati: 'पति',
  patni: 'पत्नी',
};

const CONSONANTS: Array<[string, string]> = [
  ['ksh', 'क्ष'],
  ['gya', 'ज्ञ'],
  ['gy', 'ज्ञ'],
  ['tra', 'त्र'],
  ['tr', 'त्र'],
  ['chh', 'छ'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ng', 'ङ'],
  ['ch', 'च'],
  ['jh', 'झ'],
  ['yn', 'ञ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['Th', 'ठ'],
  ['Dh', 'ढ'],
  ['Sh', 'ष'],
  ['k', 'क'],
  ['g', 'ग'],
  ['c', 'क'],
  ['j', 'ज'],
  ['z', 'ज'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ'],
  ['b', 'ब'],
  ['v', 'व'],
  ['w', 'व'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['s', 'स'],
  ['h', 'ह'],
  ['T', 'ट'],
  ['D', 'ड'],
  ['N', 'ण'],
];

const VOWELS: Array<[string, string, string]> = [
  ['aau', 'ाउ', 'आउ'],
  ['aai', 'ाइ', 'आइ'],
  ['aa', 'ा', 'आ'],
  ['a', '', 'अ'],
  ['ee', 'ी', 'ई'],
  ['ai', 'ै', 'ऐ'],
  ['au', 'ौ', 'औ'],
  ['oo', 'ू', 'ऊ'],
  ['ou', 'ौ', 'औ'],
  ['i', 'ि', 'इ'],
  ['u', 'ु', 'उ'],
  ['e', 'े', 'ए'],
  ['o', 'ो', 'ओ'],
  ['am', 'ं', 'अं'],
  ['an', 'ं', 'अं'],
];

export function transliterateWord(word: string): string {
  if (!word) return '';

  // Preserve non-alphanumeric punctuation
  if (/^[^\w\s]+$/.test(word)) return word;

  const lower = word.toLowerCase();
  if (SPECIAL_WORDS[lower]) return SPECIAL_WORDS[lower];

  let res = '';
  let i = 0;
  const len = word.length;

  while (i < len) {
    const char = word[i];

    // Numbers
    if (char >= '0' && char <= '9') {
      const nepDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      res += nepDigits[Number(char)];
      i++;
      continue;
    }

    // Try matching consonant
    let matchedConsonant: string | null = null;
    let consLen = 0;
    for (const [cStr, cDev] of CONSONANTS) {
      if (word.substring(i, i + cStr.length).toLowerCase() === cStr.toLowerCase()) {
        matchedConsonant = cDev;
        consLen = cStr.length;
        break;
      }
    }

    if (matchedConsonant) {
      i += consLen;
      // Now check following vowel
      let matchedVowel: string | null = null;
      let vowLen = 0;
      for (const [vStr, vMatra] of VOWELS) {
        if (word.substring(i, i + vStr.length).toLowerCase() === vStr.toLowerCase()) {
          matchedVowel = vMatra;
          vowLen = vStr.length;
          break;
        }
      }

      if (matchedVowel !== null) {
        res += matchedConsonant + matchedVowel;
        i += vowLen;
      } else {
        if (i === len) {
          res += matchedConsonant;
        } else {
          res += matchedConsonant + '्';
        }
      }
    } else {
      // Independent vowel
      let matchedIndep: string | null = null;
      let vowLen = 0;
      for (const [vStr, , vIndep] of VOWELS) {
        if (word.substring(i, i + vStr.length).toLowerCase() === vStr.toLowerCase()) {
          matchedIndep = vIndep;
          vowLen = vStr.length;
          break;
        }
      }

      if (matchedIndep) {
        res += matchedIndep;
        i += vowLen;
      } else {
        res += char;
        i++;
      }
    }
  }

  return res;
}

/**
 * Transliterates an entire string sentence word by word while preserving spaces and punctuation.
 */
export function transliterateSentence(text: string): string {
  if (!text) return '';
  // Split by whitespace while preserving delimiters
  return text.replace(/([a-zA-Z0-9]+)/g, (match) => {
    return transliterateWord(match);
  });
}

/**
 * Returns multiple viable transliteration candidates for a Romanized English word.
 * e.g. 'kamti' -> ['काम्ती', 'काम्ति', 'काम्टी', 'kamti']
 * e.g. 'shrestha' -> ['श्रेष्ठ', 'श्रेष्ट', 'shrestha']
 * e.g. 'pokharel' -> ['पोखरेल', 'पोख्रेल', 'pokharel']
 * e.g. 'mandal' -> ['मण्डल', 'मंडल', 'mandal']
 */
export function getTransliterationSuggestions(rawWord: string): string[] {
  if (!rawWord || !rawWord.trim()) return [];
  const word = rawWord.trim();
  const lower = word.toLowerCase();

  const primary = transliterateWord(word);
  const candidates: string[] = [primary];

  // Specific common Nepali name/word alternate rules
  const COMMON_ALTERNATES: Record<string, string[]> = {
    navadurga: ['नवदुर्गा', 'नवदुर्ग', 'णवदुर्गा'],
    nawadurga: ['नवदुर्गा', 'नवदुर्ग'],
    durga: ['दुर्गा', 'दुर्ग'],
    kamti: ['काम्ती', 'काम्ति', 'काम्टी'],
    yogesh: ['योगेश', 'योगेस', 'योगेष'],
    pokharel: ['पोखरेल', 'पोख्रेल'],
    pokhrel: ['पोख्रेल', 'पोखरेल'],
    shrestha: ['श्रेष्ठ', 'श्रेष्ट'],
    sah: ['साह', 'शाह', 'साहा'],
    shah: ['शाह', 'साह'],
    thakur: ['ठाकुर', 'थाकुर'],
    mandal: ['मण्डल', 'मंडल'],
    chaudhary: ['चौधरी', 'चौधरि'],
    adhikari: ['अधिकारी', 'अधिकारि'],
    bhattarai: ['भट्टराई', 'भट्टराइ'],
    chhetri: ['क्षेत्री', 'छेत्री', 'क्षेत्रि'],
    yadav: ['यादव', 'जादव'],
    bhandari: ['भण्डारी', 'भंडारी', 'भण्डारि'],
    karki: ['कार्की', 'कार्कि'],
    paudel: ['पौडेल', 'पौड्याल'],
    poudel: ['पौडेल', 'पौड्याल'],
    subedi: ['सुवेदी', 'सुवेदि'],
    pandey: ['पाण्डेय', 'पाण्डे'],
    singh: ['सिंह', 'सिँह'],
    kumar: ['कुमार', 'कुँवर'],
    devi: ['देवी', 'देवि'],
    maya: ['माया'],
    prasad: ['प्रसाद'],
  };

  if (COMMON_ALTERNATES[lower]) {
    candidates.unshift(...COMMON_ALTERNATES[lower]);
  }

  // 1. If word ends with दीर्घ 'ी', add variant with ह्रस्व 'ि' and vice-versa
  if (primary.endsWith('ी')) {
    candidates.push(primary.slice(0, -1) + 'ि');
  } else if (primary.endsWith('ि')) {
    candidates.push(primary.slice(0, -1) + 'ी');
  }

  // 2. Variant for त vs ट (e.g., काम्ती <-> काम्टी)
  if (primary.includes('ती')) {
    candidates.push(primary.replace(/ती/g, 'टी'));
    candidates.push(primary.replace(/ती/g, 'ति'));
    candidates.push(primary.replace(/ती/g, 'टि'));
  } else if (primary.includes('ति')) {
    candidates.push(primary.replace(/ति/g, 'टि'));
    candidates.push(primary.replace(/ति/g, 'ती'));
  } else if (primary.includes('टी')) {
    candidates.push(primary.replace(/टी/g, 'ती'));
    candidates.push(primary.replace(/टी/g, 'टि'));
  } else if (primary.includes('टि')) {
    candidates.push(primary.replace(/टि/g, 'ति'));
    candidates.push(primary.replace(/टि/g, 'टी'));
  }

  // 3. Variant for श vs ष vs स
  if (primary.includes('श')) {
    candidates.push(primary.replace(/श/g, 'स'));
    candidates.push(primary.replace(/श/g, 'ष'));
  } else if (primary.includes('स')) {
    candidates.push(primary.replace(/स/g, 'श'));
  }

  // 4. Variant for ब vs व
  if (primary.includes('ब')) {
    candidates.push(primary.replace(/ब/g, 'व'));
  } else if (primary.includes('व')) {
    candidates.push(primary.replace(/व/g, 'ब'));
  }

  // 5. Variant for ण्ड vs ंड (Mandal, Bhandari)
  if (primary.includes('ण्ड')) {
    candidates.push(primary.replace(/ण्ड/g, 'ंड'));
  } else if (primary.includes('ंड')) {
    candidates.push(primary.replace(/ंड/g, 'ण्ड'));
  }

  // 6. Variant for क्ष vs छ (Chhetri)
  if (primary.includes('क्ष')) {
    candidates.push(primary.replace(/क्ष/g, 'छ'));
  } else if (primary.includes('छ')) {
    candidates.push(primary.replace(/छ/g, 'क्ष'));
  }

  // 7. Variant for न vs ण (Navadurga, Narayan, etc.)
  if (primary.includes('न')) {
    candidates.push(primary.replace(/न/g, 'ण'));
  } else if (primary.includes('ण')) {
    candidates.push(primary.replace(/ण/g, 'न'));
  }

  // 8. Variant for द vs ड
  if (primary.includes('द')) {
    candidates.push(primary.replace(/द/g, 'ड'));
  } else if (primary.includes('ड')) {
    candidates.push(primary.replace(/ड/g, 'द'));
  }

  // 9. If word ends with 'a', offer both ending in 'ा' (aakar) and inherent consonant
  if (
    word.endsWith('a') &&
    !primary.endsWith('ा') &&
    !primary.endsWith('ि') &&
    !primary.endsWith('ी') &&
    !primary.endsWith('ु') &&
    !primary.endsWith('ू') &&
    !primary.endsWith('े') &&
    !primary.endsWith('ो')
  ) {
    candidates.push(primary + 'ा');
  }

  // If word has specific dictionary entry, ensure it's first
  if (SPECIAL_WORDS[lower] && !candidates.includes(SPECIAL_WORDS[lower])) {
    candidates.unshift(SPECIAL_WORDS[lower]);
  }

  // Always offer original English raw word as selectable option
  candidates.push(word);

  // Return unique non-empty candidates (max 5 options)
  return Array.from(new Set(candidates)).filter(Boolean).slice(0, 5);
}
