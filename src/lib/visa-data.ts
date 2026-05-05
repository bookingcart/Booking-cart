/**
 * Visa data utilities — ported from Booking-Cart-001-main/public/data/visa-dataset.js
 */

// ── ISO2 ↔ Country name mappings (199 countries) ──────────────────────────────
export const ISO2_TO_COUNTRY: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AD: 'Andorra', AO: 'Angola',
  AG: 'Antigua and Barbuda', AR: 'Argentina', AM: 'Armenia', AU: 'Australia',
  AT: 'Austria', AZ: 'Azerbaijan', BS: 'Bahamas', BH: 'Bahrain', BD: 'Bangladesh',
  BB: 'Barbados', BY: 'Belarus', BE: 'Belgium', BZ: 'Belize', BJ: 'Benin',
  BT: 'Bhutan', BO: 'Bolivia', BA: 'Bosnia and Herzegovina', BW: 'Botswana',
  BR: 'Brazil', BN: 'Brunei', BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi',
  KH: 'Cambodia', CM: 'Cameroon', CA: 'Canada', CV: 'Cabo Verde',
  CF: 'Central African Republic', TD: 'Chad', CL: 'Chile', CN: 'China',
  CO: 'Colombia', KM: 'Comoros', CG: 'Congo',
  CD: 'Democratic Republic of the Congo', CR: 'Costa Rica',
  CI: "Côte d'Ivoire", HR: 'Croatia', CU: 'Cuba', CY: 'Cyprus',
  CZ: 'Czech Republic', DK: 'Denmark', DJ: 'Djibouti', DM: 'Dominica',
  DO: 'Dominican Republic', EC: 'Ecuador', EG: 'Egypt', SV: 'El Salvador',
  GQ: 'Equatorial Guinea', ER: 'Eritrea', EE: 'Estonia', SZ: 'Eswatini',
  ET: 'Ethiopia', FJ: 'Fiji', FI: 'Finland', FR: 'France', GA: 'Gabon',
  GM: 'Gambia', GE: 'Georgia', DE: 'Germany', GH: 'Ghana', GR: 'Greece',
  GD: 'Grenada', GT: 'Guatemala', GN: 'Guinea', GW: 'Guinea-Bissau',
  GY: 'Guyana', HT: 'Haiti', HN: 'Honduras', HK: 'Hong Kong', HU: 'Hungary',
  IS: 'Iceland', IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq',
  IE: 'Ireland', IL: 'Israel', IT: 'Italy', JM: 'Jamaica', JP: 'Japan',
  JO: 'Jordan', KZ: 'Kazakhstan', KE: 'Kenya', KI: 'Kiribati', XK: 'Kosovo',
  KW: 'Kuwait', KG: 'Kyrgyzstan', LA: 'Laos', LV: 'Latvia', LB: 'Lebanon',
  LS: 'Lesotho', LR: 'Liberia', LY: 'Libya', LI: 'Liechtenstein',
  LT: 'Lithuania', LU: 'Luxembourg', MO: 'Macau', MG: 'Madagascar',
  MW: 'Malawi', MY: 'Malaysia', MV: 'Maldives', ML: 'Mali', MT: 'Malta',
  MH: 'Marshall Islands', MR: 'Mauritania', MU: 'Mauritius', MX: 'Mexico',
  FM: 'Micronesia', MD: 'Moldova', MC: 'Monaco', MN: 'Mongolia',
  ME: 'Montenegro', MA: 'Morocco', MZ: 'Mozambique', MM: 'Myanmar',
  NA: 'Namibia', NR: 'Nauru', NP: 'Nepal', NL: 'Netherlands',
  NZ: 'New Zealand', NI: 'Nicaragua', NE: 'Niger', NG: 'Nigeria',
  KP: 'North Korea', MK: 'North Macedonia', NO: 'Norway', OM: 'Oman',
  PK: 'Pakistan', PW: 'Palau', PS: 'Palestine', PA: 'Panama',
  PG: 'Papua New Guinea', PY: 'Paraguay', PE: 'Peru', PH: 'Philippines',
  PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania', RU: 'Russia',
  RW: 'Rwanda', KN: 'Saint Kitts and Nevis', LC: 'Saint Lucia',
  VC: 'Saint Vincent and the Grenadines', WS: 'Samoa', SM: 'San Marino',
  ST: 'São Tomé and Príncipe', SA: 'Saudi Arabia', SN: 'Senegal', RS: 'Serbia',
  SC: 'Seychelles', SL: 'Sierra Leone', SG: 'Singapore', SK: 'Slovakia',
  SI: 'Slovenia', SB: 'Solomon Islands', SO: 'Somalia', ZA: 'South Africa',
  KR: 'South Korea', SS: 'South Sudan', ES: 'Spain', LK: 'Sri Lanka',
  SD: 'Sudan', SR: 'Suriname', SE: 'Sweden', CH: 'Switzerland', SY: 'Syria',
  TW: 'Taiwan', TJ: 'Tajikistan', TZ: 'Tanzania', TH: 'Thailand',
  TL: 'Timor-Leste', TG: 'Togo', TO: 'Tonga', TT: 'Trinidad and Tobago',
  TN: 'Tunisia', TM: 'Turkmenistan', TV: 'Tuvalu', TR: 'Turkey',
  UG: 'Uganda', UA: 'Ukraine', AE: 'United Arab Emirates',
  GB: 'United Kingdom', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan',
  VU: 'Vanuatu', VA: 'Vatican City', VE: 'Venezuela', VN: 'Vietnam',
  YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
};

export const COUNTRY_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_COUNTRY).map(([iso2, name]) => [name, iso2]),
);

/** Sorted list of all country names — use for dropdown options */
export const VISA_COUNTRIES: string[] = Object.values(ISO2_TO_COUNTRY).sort();

/** Convert a 2-letter ISO code to a flag emoji */
export function flagEmojiFromIso2(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🌐';
  return String.fromCodePoint(
    ...iso2.toUpperCase().split('').map(c => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** Return the display visa type for a passport → destination pair */
export function getVisaRequirement(passportIso2: string, destIso2: string): string {
  const key = `${passportIso2.toUpperCase()}-${destIso2.toUpperCase()}`;
  if (VISA_DETAILS[key]) return VISA_DETAILS[key].visaType;
  // same-country
  if (passportIso2.toUpperCase() === destIso2.toUpperCase()) return 'Citizen';
  return 'Visa required';
}

export interface VisaDetails {
  visaType: string;
  stayDuration: string;
  passportValidity: string;
  returnTicket: boolean;
  proofOfFunds: boolean;
  healthRequirements: string[];
  notes: string;
  processingTime: string;
  fee: number | string;
}

export const VISA_DETAILS: Record<string, VisaDetails> = {
  'US-CA': {
    visaType: 'Visa-free',
    stayDuration: '6 months',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'eTA required if flying',
    processingTime: 'Immediate',
    fee: 0,
  },
  'US-MX': {
    visaType: 'Visa-free',
    stayDuration: '180 days',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'FMM tourist card free',
    processingTime: 'Immediate',
    fee: 0,
  },
  'KE-UG': {
    visaType: 'Visa-free',
    stayDuration: '90 days',
    passportValidity: '6 months',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: ['Yellow fever'],
    notes: 'East African Community',
    processingTime: 'Immediate',
    fee: 0,
  },
  'GB-FR': {
    visaType: 'Visa-free',
    stayDuration: '90 days / 180 days',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'Brexit rules apply',
    processingTime: 'Immediate',
    fee: 0,
  },
  'AU-US': {
    visaType: 'Visa-free',
    stayDuration: '90 days',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'ESTA required',
    processingTime: '72 hours',
    fee: 21,
  },
};

export function generateDefaultVisaDetails(requirement?: string | number): VisaDetails {
  const req = String(requirement ?? '').toLowerCase();

  if (req.includes('visa free') || (!isNaN(Number(req)) && req !== '' && req !== '-1')) {
    return {
      visaType: 'Visa-free',
      stayDuration: !isNaN(Number(req)) && req !== '' ? `${req} days` : '90 days',
      passportValidity: '6 months beyond arrival',
      returnTicket: false,
      proofOfFunds: false,
      healthRequirements: [],
      notes: 'Verify requirements with the embassy before travel.',
      processingTime: 'Immediate',
      fee: 0,
    };
  }

  if (req.includes('visa on arrival')) {
    return {
      visaType: 'Visa on arrival',
      stayDuration: '30 days',
      passportValidity: '6 months beyond arrival',
      returnTicket: true,
      proofOfFunds: true,
      healthRequirements: [],
      notes: 'Obtain visa at the port of entry.',
      processingTime: 'On arrival',
      fee: 'Varies',
    };
  }

  if (req.includes('e-visa') || req.includes('eta')) {
    return {
      visaType: req.includes('eta') ? 'eTA' : 'eVisa',
      stayDuration: '30–90 days',
      passportValidity: '6 months beyond arrival',
      returnTicket: true,
      proofOfFunds: false,
      healthRequirements: [],
      notes: 'Apply online before travel.',
      processingTime: '3–7 days',
      fee: 'Varies',
    };
  }

  return {
    visaType: 'Visa required',
    stayDuration: 'Varies',
    passportValidity: '6 months beyond arrival',
    returnTicket: true,
    proofOfFunds: true,
    healthRequirements: [],
    notes: 'Embassy or consulate visa required.',
    processingTime: '10–30 days',
    fee: 'Varies',
  };
}

export function getVisaDetails(
  passportIso2: string,
  destIso2: string,
  requirementRaw?: string | number,
): VisaDetails | null {
  const key = `${passportIso2.toUpperCase()}-${destIso2.toUpperCase()}`;
  if (VISA_DETAILS[key]) return VISA_DETAILS[key];
  if (requirementRaw !== undefined) return generateDefaultVisaDetails(requirementRaw);
  return null;
}
