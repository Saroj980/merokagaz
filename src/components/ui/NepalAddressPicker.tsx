'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Check, Building, Home, Hash, Edit3 } from 'lucide-react';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import NepaliInput from '@/components/ui/NepaliInput';
import geoData from '@/data/nepal_administrative_divisions.json';
import { toNepaliDigits } from '@/lib/nepaliDate';

export interface NepalAddressValue {
  province?: string;
  province_id?: number;
  district?: string;
  district_id?: number;
  municipality?: string;
  municipality_id?: number;
  ward?: string;
  tole?: string;
  formatted?: string;
}

export interface NepalAddressPickerProps {
  value: string;
  onChange: (formattedAddress: string, structuredData?: NepalAddressValue) => void;
  isNe?: boolean;
  hasError?: boolean;
  placeholder?: string | null;
}

function cleanNepaliText(txt: string) {
  return (txt || '').replace(/[।\.,\-_]/g, '').trim();
}

function parseInitialAddress(addrStr: string) {
  if (!addrStr || typeof addrStr !== 'string') return null;
  const s = addrStr.trim();
  const provinces = geoData.provinces || [];

  // Find province
  let matchedProvince: any = null;
  for (const p of provinces) {
    const pNe = cleanNepaliText(p.name_ne);
    if (s.includes(pNe) || s.includes(p.name_en)) {
      matchedProvince = p;
      break;
    }
  }

  // Find district
  let matchedDistrict: any = null;
  const searchProvinces = matchedProvince ? [matchedProvince] : provinces;
  for (const p of searchProvinces) {
    for (const d of p.districts) {
      const dNe = cleanNepaliText(d.name_ne);
      if (s.includes(dNe) || s.toLowerCase().includes(d.name_en.toLowerCase())) {
        matchedDistrict = d;
        matchedProvince = p;
        break;
      }
    }
    if (matchedDistrict) break;
  }

  // Find municipality
  let matchedMuni: any = null;
  const searchDistricts = matchedDistrict
    ? [matchedDistrict]
    : matchedProvince
    ? matchedProvince.districts
    : provinces.flatMap((p) => p.districts);
  for (const d of searchDistricts) {
    for (const m of d.local_levels) {
      const mNe = cleanNepaliText(m.name_ne);
      if (s.includes(mNe) || s.toLowerCase().includes(m.name_en.toLowerCase())) {
        matchedMuni = m;
        matchedDistrict = d;
        break;
      }
    }
    if (matchedMuni) break;
  }

  // Find ward
  let matchedWard = '';
  const wardMatch =
    s.match(/वडा\s*(?:नं\.?|नम्बर)?\s*([०-९0-9]+)/u) ||
    s.match(/ward\s*(?:no\.?)?\s*([०-९0-9]+)/i) ||
    s.match(/-\s*([०-९0-9]+)/);
  if (wardMatch) {
    const devToEng: Record<string, string> = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    };
    matchedWard = wardMatch[1].replace(/[०-९]/g, (d) => devToEng[d]);
  }

  // Extract tole (any part not matched to province, district, muni, or ward)
  let tole = '';
  const parts = s.split(/[,–-]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const pClean = cleanNepaliText(part);
    const isP =
      matchedProvince &&
      (pClean.includes(cleanNepaliText(matchedProvince.name_ne)) ||
        pClean.includes(matchedProvince.name_en));
    const isD =
      matchedDistrict &&
      (pClean.includes(cleanNepaliText(matchedDistrict.name_ne)) ||
        pClean.toLowerCase().includes(matchedDistrict.name_en.toLowerCase()));
    const isM =
      matchedMuni &&
      (pClean.includes(cleanNepaliText(matchedMuni.name_ne)) ||
        pClean.toLowerCase().includes(matchedMuni.name_en.toLowerCase()));
    const isW = /वडा|ward/i.test(pClean);
    if (!isP && !isD && !isM && !isW) {
      tole = part;
      break;
    }
  }

  return {
    provinceCode: matchedProvince ? matchedProvince.code : '',
    districtName: matchedDistrict ? matchedDistrict.name_en : '',
    muniName: matchedMuni ? matchedMuni.name_en : '',
    ward: matchedWard,
    tole,
  };
}

export default function NepalAddressPicker({
  value,
  onChange,
  isNe = false,
  hasError = false,
  placeholder,
}: NepalAddressPickerProps) {
  const [isManualMode, setIsManualMode] = useState(false);

  // Cascading selections
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');
  const [selectedMuniName, setSelectedMuniName] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [toleStreet, setToleStreet] = useState<string>('');
  const [lastParsedValue, setLastParsedValue] = useState<string>('');

  // Reverse sync: Parse incoming address value into dropdowns when value changes from outside (e.g. edit mode)
  useEffect(() => {
    if (!value || isManualMode) return;
    if (value === lastParsedValue) return;

    const parsed = parseInitialAddress(value);
    if (parsed) {
      if (parsed.provinceCode) setSelectedProvinceCode(parsed.provinceCode);
      if (parsed.districtName) setSelectedDistrictName(parsed.districtName);
      if (parsed.muniName) setSelectedMuniName(parsed.muniName);
      if (parsed.ward) setSelectedWard(parsed.ward);
      if (parsed.tole) setToleStreet(parsed.tole);
      setLastParsedValue(value);
    }
  }, [value, isManualMode, lastParsedValue]);

  const provinces = geoData.provinces || [];

  // 1. Province Options
  const provinceOptions: SelectOption[] = useMemo(() => {
    return provinces.map((p) => ({
      value: p.code,
      label: isNe ? p.name_ne : p.name_en,
      subLabel: isNe ? p.name_en : p.name_ne,
      badge: `P${p.code}`,
    }));
  }, [provinces, isNe]);

  // Selected province object
  const currentProvince = useMemo(() => {
    return provinces.find((p) => p.code === selectedProvinceCode);
  }, [provinces, selectedProvinceCode]);

  // 2. District Options for selected Province
  const districtOptions: SelectOption[] = useMemo(() => {
    if (!currentProvince?.districts) return [];
    return currentProvince.districts.map((d) => ({
      value: d.name_en,
      label: isNe ? d.name_ne : d.name_en,
      subLabel: isNe ? d.name_en : d.name_ne,
    }));
  }, [currentProvince, isNe]);

  // Selected district object
  const currentDistrict = useMemo(() => {
    if (!currentProvince?.districts) return null;
    return currentProvince.districts.find(
      (d) => d.name_en.toLowerCase() === selectedDistrictName.toLowerCase()
    );
  }, [currentProvince, selectedDistrictName]);

  // 3. Municipality / Local Level Options for selected District
  const muniOptions: SelectOption[] = useMemo(() => {
    if (!currentDistrict?.local_levels) return [];
    return currentDistrict.local_levels.map((m) => {
      const typeLabel = isNe ? m.type_ne : m.type_en;
      return {
        value: m.name_en,
        label: isNe ? `${m.name_ne} (${m.type_ne})` : `${m.name_en} (${m.type_en})`,
        subLabel: isNe ? m.name_en : m.name_ne,
        badge: typeLabel,
      };
    });
  }, [currentDistrict, isNe]);

  // Selected municipality object
  const currentMuni = useMemo(() => {
    if (!currentDistrict?.local_levels) return null;
    return currentDistrict.local_levels.find(
      (m) => m.name_en.toLowerCase() === selectedMuniName.toLowerCase()
    );
  }, [currentDistrict, selectedMuniName]);

  // 4. Ward Options (Wards 1 to 35)
  const wardOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    const nepaliNums = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const toNeNum = (n: number) =>
      String(n)
        .split('')
        .map((digit) => nepaliNums[Number(digit)] || digit)
        .join('');

    for (let i = 1; i <= 35; i++) {
      list.push({
        value: String(i),
        label: isNe ? `वडा नं. ${toNeNum(i)}` : `Ward No. ${i}`,
      });
    }
    return list;
  }, [isNe]);

  // Update full formatted string whenever structured inputs change
  useEffect(() => {
    if (isManualMode) return;
    if (!selectedProvinceCode && !selectedDistrictName && !selectedMuniName && !selectedWard && !toleStreet) {
      return;
    }

    const parts: string[] = [];

    // 1. Tole / Street / House No. (Smallest local identifier)
    if (toleStreet.trim()) {
      parts.push(toleStreet.trim());
    }

    // 2. Municipality - Ward (Local government unit + Ward)
    if (currentMuni && selectedWard) {
      const muniName = isNe ? currentMuni.name_ne : currentMuni.name_en;
      const muniType = isNe ? currentMuni.type_ne : currentMuni.type_en;
      const wardStr = isNe ? toNepaliDigits(selectedWard) : selectedWard;
      parts.push(`${muniName} ${muniType} - ${wardStr}`);
    } else if (currentMuni) {
      const muniName = isNe ? currentMuni.name_ne : currentMuni.name_en;
      const muniType = isNe ? currentMuni.type_ne : currentMuni.type_en;
      parts.push(`${muniName} ${muniType}`);
    } else if (selectedWard) {
      const wardStr = isNe ? toNepaliDigits(selectedWard) : selectedWard;
      parts.push(isNe ? `वडा नं. ${wardStr}` : `Ward No. ${wardStr}`);
    }

    // 3. District
    if (currentDistrict) {
      parts.push(isNe ? currentDistrict.name_ne : currentDistrict.name_en);
    }

    // 4. Province (Largest administrative division)
    if (currentProvince) {
      parts.push(isNe ? currentProvince.name_ne : currentProvince.name_en);
    }

    const fullStr = parts.join(', ');
    if (fullStr) {
      onChange(fullStr, {
        province: currentProvince ? (isNe ? currentProvince.name_ne : currentProvince.name_en) : undefined,
        province_id: currentProvince ? (currentProvince as any).id : undefined,
        district: currentDistrict ? (isNe ? currentDistrict.name_ne : currentDistrict.name_en) : undefined,
        district_id: currentDistrict ? (currentDistrict as any).id : undefined,
        municipality: currentMuni ? (isNe ? currentMuni.name_ne : currentMuni.name_en) : undefined,
        municipality_id: currentMuni ? (currentMuni as any).id : undefined,
        ward: selectedWard || undefined,
        tole: toleStreet.trim() || undefined,
        formatted: fullStr,
      });
    }
  }, [selectedProvinceCode, selectedDistrictName, selectedMuniName, selectedWard, toleStreet, isNe, isManualMode]);

  // Handlers for cascades
  const handleProvinceSelect = (code: string) => {
    setSelectedProvinceCode(code);
    setSelectedDistrictName('');
    setSelectedMuniName('');
    setSelectedWard('');
  };

  const handleDistrictSelect = (name: string) => {
    setSelectedDistrictName(name);
    setSelectedMuniName('');
    setSelectedWard('');
  };

  const handleMuniSelect = (name: string) => {
    setSelectedMuniName(name);
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b from-white to-slate-50/50 p-4 transition-all ${
        hasError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200 shadow-2xs'
      }`}
    >
      {/* Header with Mode Toggle */}
      <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D]">
          <MapPin className="h-3.5 w-3.5 text-[#18A999]" />
          <span>{isNe ? 'नेपालको आधिकारिक ठेगाना छनोट' : 'Official Nepal Address Hierarchy'}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsManualMode(!isManualMode)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
        >
          <Edit3 className="h-3 w-3" />
          <span>{isManualMode ? (isNe ? 'ड्रपडाउनबाट छान्नुहोस्' : 'Use Cascading Dropdowns') : (isNe ? 'सीधा लेख्नुहोस् (Manual)' : 'Type Directly')}</span>
        </button>
      </div>

      {isManualMode ? (
        <div>
          <NepaliInput
            value={value}
            onChange={(val) => onChange(val)}
            placeholder={placeholder || (isNe ? 'काठमाडौं महानगरपालिका, वडा नं. १०, नयाँ बानेश्वर' : 'Kathmandu Metro, Ward 10, New Baneshwor')}
            isNe={isNe}
            enableTransliteration={true}
            hasError={hasError}
          />
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Cascading 4-step Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Step 1: Province */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                १. {isNe ? 'प्रदेश' : 'Province'} <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={selectedProvinceCode}
                onChange={handleProvinceSelect}
                options={provinceOptions}
                placeholder={isNe ? 'प्रदेश छान्नुहोस्...' : 'Select Province...'}
                searchPlaceholder={isNe ? 'प्रदेश खोज्नुहोस्...' : 'Search province...'}
                searchable={false}
              />
            </div>

            {/* Step 2: District */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                २. {isNe ? 'जिल्ला' : 'District'} <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={selectedDistrictName}
                onChange={handleDistrictSelect}
                options={districtOptions}
                placeholder={
                  !selectedProvinceCode
                    ? isNe
                      ? 'पहिले प्रदेश छान्नुहोस्'
                      : 'Select Province first'
                    : isNe
                    ? 'जिल्ला छान्नुहोस्...'
                    : 'Select District...'
                }
                searchPlaceholder={isNe ? 'जिल्ला खोज्नुहोस्...' : 'Search district...'}
                disabled={!selectedProvinceCode}
                searchable={true}
              />
            </div>

            {/* Step 3: Municipality / Local Level */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                ३. {isNe ? 'नगरपालिका / गाउँपालिका' : 'Local Level (Mun / RM)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={selectedMuniName}
                onChange={handleMuniSelect}
                options={muniOptions}
                placeholder={
                  !selectedDistrictName
                    ? isNe
                      ? 'पहिले जिल्ला छान्नुहोस्'
                      : 'Select District first'
                    : isNe
                    ? 'पालिका छान्नुहोस्...'
                    : 'Select Municipality...'
                }
                searchPlaceholder={isNe ? 'पालिका खोज्नुहोस्...' : 'Search municipality...'}
                disabled={!selectedDistrictName}
                searchable={true}
              />
            </div>

            {/* Step 4: Ward No */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                ४. {isNe ? 'वडा नम्बर' : 'Ward Number'} <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={selectedWard}
                onChange={(wardVal) => setSelectedWard(wardVal)}
                options={wardOptions}
                placeholder={isNe ? 'वडा नं. छान्नुहोस्...' : 'Select Ward...'}
                searchPlaceholder={isNe ? 'वडा खोज्नुहोस्...' : 'Search ward...'}
                disabled={!selectedMuniName}
                searchable={true}
              />
            </div>
          </div>

          {/* Step 5: Tole / Street / House No with English-to-Nepali transliteration */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-600 block">
              ५. {isNe ? 'टोल / मार्ग / घर नम्बर' : 'Tole / Street / House No.'}
            </label>
            <NepaliInput
              value={toleStreet}
              onChange={(val) => setToleStreet(val)}
              placeholder={isNe ? 'नयाँ बानेश्वर, शान्तिमार्ग' : 'Naya Baneshwor, Shanti Marga'}
              isNe={isNe}
              enableTransliteration={true}
            />
          </div>

          {/* Live Compiled Address Display */}
          {value && (
            <div className="rounded-xl bg-teal-50/70 p-2.5 border border-teal-200/70 text-xs text-[#123B5D] flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 text-[#18A999] mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#148C7E] block">
                  {isNe ? 'कागजातमा समावेश हुने ठेगाना:' : 'Formatted Document Address:'}
                </span>
                <span className="font-semibold">{value}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
