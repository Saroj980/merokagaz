'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ne' | 'en';

interface Translations {
  [key: string]: {
    ne: string;
    en: string;
  };
}

export const translations: Translations = {
  // Top Notice
  topNoticeBadge: {
    ne: 'नयाँ',
    en: 'NEW',
  },
  topNoticeText: {
    ne: 'आन्तरिक राजस्व विभाग (IRD) र कम्पनी रजिष्ट्रार (OCR) का नयाँ ढाँचाहरू उपलब्ध छन्।',
    en: 'Updated IRD and OCR official template formats are now available.',
  },
  topNoticeLink: {
    ne: 'कागजात हेर्नुहोस् →',
    en: 'View Documents →',
  },

  // Navigation
  navHome: {
    ne: 'गृहपृष्ठ',
    en: 'Home',
  },
  navIrd: {
    ne: 'कर / IRD फारम',
    en: 'Tax / IRD Forms',
  },
  navOcr: {
    ne: 'कम्पनी / OCR दर्ता',
    en: 'Company / OCR',
  },
  navAllDocs: {
    ne: 'सबै कागजातहरू',
    en: 'All Documents',
  },
  navSearch: {
    ne: 'खोज्नुहोस्',
    en: 'Search',
  },
  navGetStarted: {
    ne: 'कागजात सुरु गर्नुहोस्',
    en: 'Get Started',
  },

  // Hero
  heroTrustBadge: {
    ne: 'नेपाल सरकारका IRD तथा OCR का आधिकारिक ढाँचाहरू',
    en: 'Official Templates for Nepal Government IRD & OCR',
  },
  heroTitlePrefix: {
    ne: 'सरकारी कागजातहरू अब',
    en: 'Government Documents Made',
  },
  heroTitleHighlight: {
    ne: 'त्रुटिरहित र मिनेटमै',
    en: 'Accurate & Fast',
  },
  heroTitleSuffix: {
    ne: 'तयार गर्नुहोस्',
    en: 'In Just Minutes',
  },
  heroSubtitle: {
    ne: 'दलाल र लामो लाइनको झन्झट बिना आफ्नै कम्प्युटर वा मोबाइलबाट आवश्यक विवरण भर्नुहोस्। प्रमाणित ढाँचामा तत्काल प्रिन्ट-रेडी PDF प्राप्त गर्नुहोस्।',
    en: 'Fill required details easily without agents or long queues. Generate verified, print-ready official PDFs instantly.',
  },
  searchPlaceholder: {
    ne: 'कुन कागजात खोज्दै हुनुहुन्छ? (उदा: प्यान दर्ता, MOA, घर बहाल...)',
    en: 'Which document are you looking for? (e.g. PAN, MOA, Rent Agreement...)',
  },
  searchButton: {
    ne: 'खोज्नुहोस्',
    en: 'Search',
  },
  searchPopularLabel: {
    ne: 'लोकप्रिय खोजी:',
    en: 'Popular searches:',
  },

  // Stat Counters
  stat1Value: {
    ne: '३ मिनेट',
    en: '3 Mins',
  },
  stat1Label: {
    ne: 'औसत फारम भर्ने समय',
    en: 'Average Completion Time',
  },
  stat2Value: {
    ne: '१००%',
    en: '100%',
  },
  stat2Label: {
    ne: 'सरकारी ढाँचा प्रमाणित',
    en: 'Government Verified Format',
  },
  stat3Value: {
    ne: 'द्विभाषिक',
    en: 'Bilingual',
  },
  stat3Label: {
    ne: 'नेपाली तथा अंग्रेजी युनिकोड',
    en: 'Full Unicode Support',
  },
  stat4Value: {
    ne: 'तत्काल PDF',
    en: 'Instant PDF',
  },
  stat4Label: {
    ne: 'प्रिन्ट-तयार उच्च गुणस्तर',
    en: 'High Quality Print Ready',
  },

  // Department Section
  deptPreTitle: {
    ne: 'सरकारी निकायहरू',
    en: 'Government Departments',
  },
  deptMainTitle: {
    ne: 'विभाग अनुसार कागजात छान्नुहोस्',
    en: 'Browse by Department',
  },
  deptSubtitle: {
    ne: 'तपाईंलाई आवश्यक निकायको आधिकारिक फारम तुरुन्त सुरु गर्नुहोस्।',
    en: 'Select the relevant department to prepare official forms instantly.',
  },
  deptIrdTitle: {
    ne: 'आन्तरिक राजस्व विभाग (IRD)',
    en: 'Inland Revenue Department (IRD)',
  },
  deptIrdDesc: {
    ne: 'व्यक्तिगत तथा व्यवसायिक PAN दर्ता, VAT दर्ता, र कर चुक्ता सम्बन्धी आधिकारिक फारमहरू।',
    en: 'Individual & Business PAN registration, VAT filing, and official tax clearance forms.',
  },
  deptOcrTitle: {
    ne: 'कम्पनी रजिष्ट्रार कार्यालय (OCR)',
    en: 'Office of Company Registrar (OCR)',
  },
  deptOcrDesc: {
    ne: 'प्राइभेट लिमिटेड प्रबन्धपत्र (MOA), नियमावली (AOA), सञ्चालक हेरफेर निर्णय र शेयर लगत।',
    en: 'Private Limited MOA, AOA, Director changes, and shareholder share ledgers.',
  },
  deptLegalTitle: {
    ne: 'कानुनी सम्झौता तथा करार',
    en: 'Legal Deeds & Contracts',
  },
  deptLegalDesc: {
    ne: 'घर तथा कोठा बहाल सम्झौता, साझेदारी तमसुक, व्यापारिक सम्झौता र लेनदेन पत्रहरू।',
    en: 'House rent agreements, partnership deeds, commercial contracts, and promissory notes.',
  },
  deptCardCta: {
    ne: 'फारमहरू हेर्नुहोस्',
    en: 'View Forms',
  },

  // Filter Pills
  filterAll: {
    ne: 'सबै कागजात',
    en: 'All Documents',
  },
  filterIrd: {
    ne: 'कर (IRD)',
    en: 'Tax (IRD)',
  },
  filterOcr: {
    ne: 'कम्पनी (OCR)',
    en: 'Company (OCR)',
  },
  filterLegal: {
    ne: 'करारनामा',
    en: 'Contracts',
  },

  // Workflow Steps
  workflowPreTitle: {
    ne: 'सरल कार्यविधि',
    en: 'Simple Workflow',
  },
  workflowTitle: {
    ne: 'मेरो कागजले कसरी काम गर्छ?',
    en: 'How Mero Kagaz Works',
  },
  workflowSubtitle: {
    ne: '३ सरल चरणमा आफ्नो कानुनी कागजात तयार गर्नुहोस्।',
    en: 'Prepare your official document in 3 straightforward steps.',
  },
  step1Title: {
    ne: 'फारम छान्नुहोस्',
    en: 'Choose Document',
  },
  step1Desc: {
    ne: 'आवश्यक IRD, OCR वा सम्झौता फारम छनोट गर्नुहोस्। आवश्यक प्रमाण कागजातहरूको सूची तुरुन्तै हेर्न सकिनेछ।',
    en: 'Select your needed IRD, OCR, or contract template and review required supporting proofs.',
  },
  step2Title: {
    ne: 'विवरण भर्नुहोस्',
    en: 'Fill in Details',
  },
  step2Desc: {
    ne: 'हाम्रो बौद्धिक फारमले नेपाली र अंग्रेजी दुवै भाषामा त्रुटिरहित डाटा प्रमाणीकरण सहित विवरण लिन्छ।',
    en: 'Our smart form collects your details with live error validation and guided help.',
  },
  step3Title: {
    ne: 'PDF डाउनलोड गर्नुहोस्',
    en: 'Download PDF',
  },
  step3Desc: {
    ne: 'eSewa वा Khalti बाट सहजै भुक्तानी गर्नुहोस् र सरकारी कार्यालयमा सीधै बुझाउन मिल्ने आधिकारिक PDF प्राप्त गर्नुहोस्।',
    en: 'Pay securely via eSewa or Khalti and get an official print-ready PDF ready for submission.',
  },

  // Document Card Actions
  cardDetailsBtn: {
    ne: 'विवरण हेर्नुहोस्',
    en: 'View Details',
  },
  cardFormBtn: {
    ne: 'फारम भर्नुहोस् →',
    en: 'Fill Form →',
  },

  // CTA Section
  ctaBadge: {
    ne: 'तत्काल सुरु गर्नुहोस्',
    en: 'Get Started Today',
  },
  ctaTitle: {
    ne: 'कुनै मध्यस्थकर्ता बिना, आफ्नै हातबाट सरकारी कागजात बनाउनुहोस्।',
    en: 'Prepare government-compliant documents without any agents or middlemen.',
  },
  ctaSubtitle: {
    ne: 'हजारौं नेपाली नागरिक र व्यवसायीहरूले मेरो कागज प्रयोग गरी समय र पैसा बचाइरहेका छन्।',
    en: 'Thousands of Nepali citizens and business owners save time and money with Mero Kagaz.',
  },
  ctaExploreBtn: {
    ne: 'सबै फारमहरू हेर्नुहोस् →',
    en: 'Explore All Forms →',
  },
  ctaPanBtn: {
    ne: 'PAN दर्ता सुरु गर्नुहोस्',
    en: 'Start PAN Registration',
  },

  // Footer
  footerAbout: {
    ne: 'नेपालका सरकारी कार्यालयहरू (IRD, OCR, कम्पनी रजिष्ट्रार) का आवश्यक कागजात र फारमहरू केही मिनेटमै त्रुटिरहित तयार गर्ने आधुनिक डिजिटल मञ्च।',
    en: 'A modern digital platform to prepare error-free, legally compliant Nepal government documents in minutes.',
  },
  footerVerifiedBadge: {
    ne: '१००% आधिकारिक ढाँचा अनुसार प्रमाणित',
    en: '100% Official Format Verified',
  },
  footerServicesTitle: {
    ne: 'सरकारी सेवाहरू',
    en: 'Services',
  },
  footerLinksTitle: {
    ne: 'सहयोग र जानकारी',
    en: 'Quick Links',
  },
  footerAdminLink: {
    ne: 'प्रशासक लगइन',
    en: 'Admin Portal',
  },
  footerPaymentsTitle: {
    ne: 'भुक्तानी साझेदारहरू',
    en: 'Payment Partners',
  },
  footerCopyright: {
    ne: 'सर्वाधिकार सुरक्षित। डिजिटल नेपाल अभियानमा समर्पित।',
    en: 'All rights reserved. Dedicated to the Digital Nepal initiative.',
  },

  // Admin Login
  adminPortalBadge: {
    ne: 'केन्द्रीय प्रशासकीय प्रणाली',
    en: 'Central Admin Portal',
  },
  adminSignInTitle: {
    ne: 'साइन इन गर्नुहोस्',
    en: 'Sign In',
  },
  adminSignInSubtitle: {
    ne: 'सुरक्षित प्रशासक प्रमाण-पत्र प्रविष्ट गर्नुहोस्',
    en: 'Enter your verified administrator credentials',
  },
  adminEmailLabel: {
    ne: 'ईमेल ठेगाना',
    en: 'Email Address',
  },
  adminPasswordLabel: {
    ne: 'पासवर्ड',
    en: 'Password',
  },
  adminSubmitBtn: {
    ne: 'लगइन गर्नुहोस्',
    en: 'Sign In',
  },
  adminSubmittingBtn: {
    ne: 'प्रमाणीकरण हुँदैछ...',
    en: 'Authenticating...',
  },
  adminShowPassword: {
    ne: 'पासवर्ड देखाउनुहोस्',
    en: 'Show Password',
  },
  adminHidePassword: {
    ne: 'पासवर्ड लुकाउनुहोस्',
    en: 'Hide Password',
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations[key]?.en ?? String(key),
  isReady: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mk_lang') as Language;
    if (saved === 'ne' || saved === 'en') {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.setAttribute('data-lang', saved);
    } else {
      setLangState('en');
      document.documentElement.lang = 'en';
      document.documentElement.setAttribute('data-lang', 'en');
    }
    setIsReady(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('mk_lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.setAttribute('data-lang', newLang);
  };

  const t = (key: keyof typeof translations): string => {
    const item = translations[key];
    if (!item) return String(key);
    return item[lang] ?? item.en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
