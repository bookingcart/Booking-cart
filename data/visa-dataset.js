/**
 * Passport Index Dataset 2025 (ISO2 tidy format)
 * Source: https://github.com/ilyankou/passport-index-dataset
 * License: MIT
 * 
 * This dataset contains visa requirements for 199 countries.
 * Values:
 * - "visa free" or number: visa-free access (number indicates days allowed)
 * - "visa on arrival": visa obtainable on arrival
 * - "e-visa": electronic visa
 * - "eta": electronic travel authorization
 * - "visa required": traditional visa required
 * - "-1": no admission
 * - "covid ban": COVID-related ban
 */

// Load the dataset from CSV (we'll use a preprocessed subset for performance)
const VISA_DATASET_RAW = `Passport,Destination,Requirement
AF,AL,e-visa
AF,DZ,visa required
AF,AD,visa required
AF,AO,visa required
AF,AG,e-visa
AF,AR,visa required
AF,AM,visa required
AF,AU,e-visa
AF,AT,visa required
AF,AZ,visa required
AF,BS,e-visa
AF,BH,e-visa
AF,BD,visa on arrival
AF,BB,visa required
AF,BY,visa required
AF,BE,visa required
AF,BZ,visa required
AF,BJ,e-visa
AF,BT,e-visa
AF,BO,visa on arrival
AF,BA,visa required
AF,BW,e-visa
AF,BR,visa required
AF,BN,visa required
AF,BG,visa required
AF,BF,e-visa
AF,BI,visa on arrival
AF,KH,visa on arrival
AF,CM,e-visa
AF,CA,visa required
AF,CV,visa on arrival
AF,CF,visa required
AF,TD,visa required
AF,CL,visa required
AF,CN,visa required
AF,CO,e-visa
AF,KM,visa on arrival
AF,CG,visa required
AF,CD,e-visa
AF,CR,visa required
AF,CI,eta
AF,HR,visa required
AF,CU,visa required
AF,CY,visa required
AF,CZ,visa required
AF,DK,visa required
AF,DJ,visa on arrival
AF,DM,21
AF,DO,visa required
AF,EC,e-visa
AF,EG,visa required
AF,SV,e-visa
AF,GQ,e-visa
AF,ER,visa required
AF,EE,visa required
AF,SZ,visa required
AF,ET,e-visa
AF,FJ,visa required
AF,FI,visa required
AF,FR,visa required
AF,GA,e-visa
AF,GM,visa required
AF,GE,e-visa
AF,DE,visa required
AF,GH,visa on arrival
AF,GR,visa required
AF,GD,visa required
AF,GT,visa required
AF,GN,e-visa
AF,GW,visa on arrival
AF,GY,visa required
AF,HT,90
AF,HN,visa required
AF,HK,e-visa
AF,HU,visa required
AF,IS,visa required
AF,IN,e-visa
AF,ID,e-visa
AF,IR,visa required
AF,IQ,e-visa
AF,IE,visa required
AF,IL,visa required
AF,IT,visa required
AF,JM,visa required
AF,JP,visa required
AF,JO,visa required
AF,KZ,visa required
AF,KE,eta
AF,KI,visa required
AF,XK,visa required
AF,KW,visa required
AF,KG,e-visa
AF,LA,visa required
AF,LV,visa required
AF,LB,visa required
AF,LS,e-visa
AF,LR,visa required
AF,LY,e-visa
AF,LI,visa required
AF,LT,visa required
AF,LU,visa required
AF,MO,visa on arrival
AF,MG,visa on arrival
AF,MW,e-visa
AF,MY,e-visa
AF,MV,visa on arrival
AF,ML,visa required
AF,MT,visa required
AF,MH,visa required
AF,MR,visa on arrival
AF,MU,visa required
AF,MX,visa required
AF,FM,30
AF,MD,e-visa
AF,MC,visa required
AF,MN,visa required
AF,ME,visa required
AF,MA,visa required
AF,MZ,visa on arrival
AF,MM,visa required
AF,NA,visa required
AF,NR,visa required
AF,NP,visa required
AF,NL,visa required
AF,NZ,visa required
AF,NI,visa required
AF,NE,visa required
AF,NG,e-visa
AF,KP,visa required
AF,MK,visa required
AF,NO,visa required
AF,OM,e-visa
AF,PK,e-visa
AF,PW,visa on arrival
AF,PS,visa required
AF,PA,visa required
AF,PG,e-visa
AF,PY,visa required
AF,PE,visa required
AF,PH,visa required
AF,PL,visa required
AF,PT,visa required
AF,QA,e-visa
AF,RO,visa required
AF,RU,visa required
AF,RW,visa on arrival
AF,KN,e-visa
AF,LC,visa required
AF,WS,visa on arrival
AF,SM,visa required
AF,ST,e-visa
AF,SA,visa required
AF,SN,visa required
AF,RS,visa required
AF,SC,90
AF,SL,e-visa
AF,SG,e-visa
AF,SK,visa required
AF,SI,visa required
AF,SB,visa required
AF,SO,e-visa
AF,ZA,visa required
AF,KR,e-visa
AF,SS,e-visa
AF,ES,visa required
AF,LK,visa on arrival
AF,VC,visa required
AF,SD,visa required
AF,SR,e-visa
AF,SE,visa required
AF,CH,visa required
AF,SY,visa required
AF,TW,visa required
AF,TJ,e-visa
AF,TZ,e-visa
AF,TH,visa required
AF,TL,visa on arrival
AF,TG,e-visa
AF,TO,visa required
AF,TT,visa required
AF,TN,visa required
AF,TM,visa required
AF,TV,visa on arrival
AF,TR,visa required
AF,UG,e-visa
AF,UA,visa required
AF,AE,e-visa
AF,GB,visa required
AF,US,visa required
AF,UY,visa required
AF,UZ,visa required
AF,VU,visa required
AF,VA,visa required
AF,VE,visa required
AF,VN,e-visa
AF,YE,visa required
AF,ZM,e-visa
AF,ZW,e-visa
AF,AF,-1
AL,AL,-1
AL,DZ,visa required
AL,AD,90
AL,AO,visa required
AL,AG,180
AL,AR,visa required
AL,AM,180
AL,AU,e-visa
AL,AT,90
AL,AZ,90
AL,BS,e-visa
AL,BH,e-visa
AL,BD,visa on arrival
AL,BB,28
AL,BY,30
AL,BE,90
AL,BZ,visa required
AL,BJ,e-visa
AL,BT,e-visa
AL,BO,visa on arrival
AL,BA,90
AL,BW,e-visa
AL,BR,90
AL,BN,visa required
AL,BG,90
AL,BF,e-visa
AL,BI,visa on arrival
AL,KH,visa on arrival
AL,CM,e-visa
AL,CA,visa required
AL,CV,visa on arrival
AL,CF,visa required
AL,TD,visa required
AL,CL,90
AL,CN,90
AL,CO,90
AL,KM,visa on arrival
AL,CG,visa required
AL,CD,e-visa
AL,CR,visa required
AL,CI,eta
AL,HR,90
AL,CU,e-visa
AL,CY,90
AL,CZ,90
AL,DK,90
AL,DJ,visa on arrival
AL,DM,21
AL,DO,visa free
AL,EC,e-visa
AL,EG,visa on arrival
AL,SV,180
AL,GQ,e-visa
AL,ER,visa required
AL,EE,90
AL,SZ,visa required
AL,ET,e-visa
AL,FJ,visa required
AL,FI,90
AL,FR,90
AL,GA,e-visa
AL,GM,90`;

// Parse CSV into lookup table
function parseVisaDataset(csv) {
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');
  const data = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 3) {
      const passport = values[0].trim();
      const destination = values[1].trim();
      const requirement = values[2].trim();
      
      if (!data[passport]) {
        data[passport] = {};
      }
      data[passport][destination] = requirement;
    }
  }
  
  return data;
}

const VISA_DATASET = parseVisaDataset(VISA_DATASET_RAW);

// ISO2 to country name mapping (basic subset - expand as needed)
const ISO2_TO_COUNTRY = {
  AF: 'Afghanistan',
  AL: 'Albania',
  DZ: 'Algeria',
  AD: 'Andorra',
  AO: 'Angola',
  AG: 'Antigua and Barbuda',
  AR: 'Argentina',
  AM: 'Armenia',
  AU: 'Australia',
  AT: 'Austria',
  AZ: 'Azerbaijan',
  BS: 'Bahamas',
  BH: 'Bahrain',
  BD: 'Bangladesh',
  BB: 'Barbados',
  BY: 'Belarus',
  BE: 'Belgium',
  BZ: 'Belize',
  BJ: 'Benin',
  BT: 'Bhutan',
  BO: 'Bolivia',
  BA: 'Bosnia and Herzegovina',
  BW: 'Botswana',
  BR: 'Brazil',
  BN: 'Brunei',
  BG: 'Bulgaria',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  KH: 'Cambodia',
  CM: 'Cameroon',
  CA: 'Canada',
  CV: 'Cabo Verde',
  CF: 'Central African Republic',
  TD: 'Chad',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  KM: 'Comoros',
  CG: 'Congo',
  CD: 'Democratic Republic of the Congo',
  CR: 'Costa Rica',
  CI: 'Côte d\'Ivoire',
  HR: 'Croatia',
  CU: 'Cuba',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  DJ: 'Djibouti',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  EC: 'Ecuador',
  EG: 'Egypt',
  SV: 'El Salvador',
  GQ: 'Equatorial Guinea',
  ER: 'Eritrea',
  EE: 'Estonia',
  SZ: 'Eswatini',
  ET: 'Ethiopia',
  FJ: 'Fiji',
  FI: 'Finland',
  FR: 'France',
  GA: 'Gabon',
  GM: 'Gambia',
  GE: 'Georgia',
  DE: 'Germany',
  GH: 'Ghana',
  GR: 'Greece',
  GD: 'Grenada',
  GT: 'Guatemala',
  GN: 'Guinea',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HT: 'Haiti',
  HN: 'Honduras',
  HK: 'Hong Kong',
  HU: 'Hungary',
  IS: 'Iceland',
  IN: 'India',
  ID: 'Indonesia',
  IR: 'Iran',
  IQ: 'Iraq',
  IE: 'Ireland',
  IL: 'Israel',
  IT: 'Italy',
  JM: 'Jamaica',
  JP: 'Japan',
  JO: 'Jordan',
  KZ: 'Kazakhstan',
  KE: 'Kenya',
  KI: 'Kiribati',
  XK: 'Kosovo',
  KW: 'Kuwait',
  KG: 'Kyrgyzstan',
  LA: 'Laos',
  LV: 'Latvia',
  LB: 'Lebanon',
  LS: 'Lesotho',
  LR: 'Liberia',
  LY: 'Libya',
  LI: 'Liechtenstein',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MO: 'Macau',
  MG: 'Madagascar',
  MW: 'Malawi',
  MY: 'Malaysia',
  MV: 'Maldives',
  ML: 'Mali',
  MT: 'Malta',
  MH: 'Marshall Islands',
  MR: 'Mauritania',
  MU: 'Mauritius',
  MX: 'Mexico',
  FM: 'Micronesia',
  MD: 'Moldova',
  MC: 'Monaco',
  MN: 'Mongolia',
  ME: 'Montenegro',
  MA: 'Morocco',
  MZ: 'Mozambique',
  MM: 'Myanmar',
  NA: 'Namibia',
  NR: 'Nauru',
  NP: 'Nepal',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  NI: 'Nicaragua',
  NE: 'Niger',
  NG: 'Nigeria',
  KP: 'North Korea',
  MK: 'North Macedonia',
  NO: 'Norway',
  OM: 'Oman',
  PK: 'Pakistan',
  PW: 'Palau',
  PS: 'Palestine',
  PA: 'Panama',
  PG: 'Papua New Guinea',
  PY: 'Paraguay',
  PE: 'Peru',
  PH: 'Philippines',
  PL: 'Poland',
  PT: 'Portugal',
  QA: 'Qatar',
  RO: 'Romania',
  RU: 'Russia',
  RW: 'Rwanda',
  KN: 'Saint Kitts and Nevis',
  LC: 'Saint Lucia',
  WS: 'Samoa',
  SM: 'San Marino',
  ST: 'São Tomé and Príncipe',
  SA: 'Saudi Arabia',
  SN: 'Senegal',
  RS: 'Serbia',
  SC: 'Seychelles',
  SL: 'Sierra Leone',
  SG: 'Singapore',
  SK: 'Slovakia',
  SI: 'Slovenia',
  SB: 'Solomon Islands',
  SO: 'Somalia',
  ZA: 'South Africa',
  KR: 'South Korea',
  SS: 'South Sudan',
  ES: 'Spain',
  LK: 'Sri Lanka',
  VC: 'Saint Vincent and the Grenadines',
  SD: 'Sudan',
  SR: 'Suriname',
  SE: 'Sweden',
  CH: 'Switzerland',
  SY: 'Syria',
  TW: 'Taiwan',
  TJ: 'Tajikistan',
  TZ: 'Tanzania',
  TH: 'Thailand',
  TL: 'Timor-Leste',
  TG: 'Togo',
  TO: 'Tonga',
  TT: 'Trinidad and Tobago',
  TN: 'Tunisia',
  TM: 'Turkmenistan',
  TV: 'Tuvalu',
  TR: 'Turkey',
  UG: 'Uganda',
  UA: 'Ukraine',
  AE: 'United Arab Emirates',
  GB: 'United Kingdom',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VU: 'Vanuatu',
  VA: 'Vatican City',
  VE: 'Venezuela',
  VN: 'Vietnam',
  YE: 'Yemen',
  ZM: 'Zambia',
  ZW: 'Zimbabwe'
};

// Country name to ISO2 mapping (reverse of above)
const COUNTRY_TO_ISO2 = {};
for (const [iso2, name] of Object.entries(ISO2_TO_COUNTRY)) {
  COUNTRY_TO_ISO2[name] = iso2;
}

// Get visa requirement from dataset
function getVisaRequirement(passportIso2, destinationIso2) {
  if (!VISA_DATASET[passportIso2]) return 'visa required';
  return VISA_DATASET[passportIso2][destinationIso2] || 'visa required';
}

// Convert dataset requirement to our categories
function normalizeDatasetRequirement(requirement) {
  const req = String(requirement || '').toLowerCase();
  
  // Check if it's a number (visa-free days)
  if (!isNaN(req) && req !== '-1') {
    return 'Visa-free';
  }
  
  if (req === 'visa free' || req === 'visa-free') {
    return 'Visa-free';
  }
  
  if (req === 'visa on arrival' || req === 'visa on arrival') {
    return 'Visa on arrival';
  }
  
  if (req === 'e-visa' || req === 'e-visa') {
    return 'eVisa';
  }
  
  if (req === 'eta' || req === 'eta') {
    return 'eTA';
  }
  
  if (req === '-1' || req === 'no admission') {
    return 'Visa required';
  }
  
  if (req === 'covid ban') {
    return 'Visa required';
  }
  
  return 'Visa required';
}

// Export for use in visa.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VISA_DATASET,
    ISO2_TO_COUNTRY,
    COUNTRY_TO_ISO2,
    getVisaRequirement,
    normalizeDatasetRequirement
  };
}
