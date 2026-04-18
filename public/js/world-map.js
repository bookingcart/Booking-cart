/**
 * World Map Visualization for Visa Tool
 * Uses SVG world map with interactive countries
 */

// Major countries with simplified paths for visualization
const WORLD_MAP_COUNTRIES = {
  'US': { x: 215, y: 220, name: 'United States' },
  'CA': { x: 215, y: 160, name: 'Canada' },
  'MX': { x: 185, y: 280, name: 'Mexico' },
  'BR': { x: 240, y: 380, name: 'Brazil' },
  'AR': { x: 210, y: 450, name: 'Argentina' },
  'GB': { x: 390, y: 170, name: 'United Kingdom' },
  'FR': { x: 395, y: 195, name: 'France' },
  'DE': { x: 420, y: 175, name: 'Germany' },
  'IT': { x: 410, y: 215, name: 'Italy' },
  'ES': { x: 370, y: 210, name: 'Spain' },
  'RU': { x: 525, y: 150, name: 'Russia' },
  'CN': { x: 650, y: 240, name: 'China' },
  'IN': { x: 585, y: 320, name: 'India' },
  'JP': { x: 765, y: 220, name: 'Japan' },
  'AU': { x: 740, y: 450, name: 'Australia' },
  'ZA': { x: 460, y: 480, name: 'South Africa' },
  'EG': { x: 470, y: 230, name: 'Egypt' },
  'SA': { x: 495, y: 265, name: 'Saudi Arabia' },
  'KE': { x: 470, y: 330, name: 'Kenya' },
  'NG': { x: 430, y: 290, name: 'Nigeria' },
  'TH': { x: 665, y: 355, name: 'Thailand' },
  'ID': { x: 710, y: 410, name: 'Indonesia' },
  'MY': { x: 665, y: 370, name: 'Malaysia' },
  'SG': { x: 682, y: 382, name: 'Singapore' },
  'PH': { x: 730, y: 335, name: 'Philippines' },
  'KR': { x: 730, y: 220, name: 'South Korea' },
  'VN': { x: 690, y: 350, name: 'Vietnam' },
  'PK': { x: 555, y: 260, name: 'Pakistan' },
  'BD': { x: 630, y: 290, name: 'Bangladesh' },
  'NZ': { x: 810, y: 470, name: 'New Zealand' },
  'CA': { x: 215, y: 160, name: 'Canada' },
  'TR': { x: 470, y: 210, name: 'Turkey' },
  'IR': { x: 515, y: 245, name: 'Iran' },
  'AE': { x: 525, y: 255, name: 'United Arab Emirates' },
  'IL': { x: 495, y: 245, name: 'Israel' },
  'UA': { x: 480, y: 190, name: 'Ukraine' },
  'PL': { x: 440, y: 160, name: 'Poland' },
  'SE': { x: 430, y: 130, name: 'Sweden' },
  'NO': { x: 410, y: 115, name: 'Norway' },
  'DK': { x: 425, y: 145, name: 'Denmark' },
  'FI': { x: 450, y: 130, name: 'Finland' },
  'GR': { x: 435, y: 220, name: 'Greece' },
  'PT': { x: 355, y: 210, name: 'Portugal' },
  'IE': { x: 375, y: 175, name: 'Ireland' },
  'NL': { x: 405, y: 155, name: 'Netherlands' },
  'BE': { x: 400, y: 175, name: 'Belgium' },
  'CH': { x: 415, y: 195, name: 'Switzerland' },
  'AT': { x: 425, y: 185, name: 'Austria' },
  'CZ': { x: 430, y: 175, name: 'Czech Republic' },
  'CO': { x: 200, y: 320, name: 'Colombia' },
  'PE': { x: 170, y: 350, name: 'Peru' },
  'CL': { x: 170, y: 480, name: 'Chile' },
  'VE': { x: 170, y: 290, name: 'Venezuela' },
  'CU': { x: 220, y: 300, name: 'Cuba' },
  'JM': { x: 222, y: 282, name: 'Jamaica' },
  'DO': { x: 219, y: 286, name: 'Dominican Republic' },
  'HT': { x: 216, y: 286, name: 'Haiti' },
  'TT': { x: 201, y: 311, name: 'Trinidad and Tobago' },
  'BB': { x: 206, y: 306, name: 'Barbados' },
  'GD': { x: 209, y: 301, name: 'Grenada' },
  'LC': { x: 208, y: 299, name: 'Saint Lucia' },
  'VC': { x: 207, y: 297, name: 'Saint Vincent and the Grenadines' },
  'KN': { x: 210, y: 296, name: 'Saint Kitts and Nevis' },
  'DM': { x: 209, y: 294, name: 'Dominica' },
  'AG': { x: 208, y: 292, name: 'Antigua and Barbuda' },
  'BS': { x: 237, y: 277, name: 'Bahamas' },
  'BZ': { x: 182, y: 292, name: 'Belize' },
  'CR': { x: 175, y: 305, name: 'Costa Rica' },
  'PA': { x: 165, y: 305, name: 'Panama' },
  'SV': { x: 177, y: 297, name: 'El Salvador' },
  'GT': { x: 177, y: 292, name: 'Guatemala' },
  'HN': { x: 182, y: 290, name: 'Honduras' },
  'NI': { x: 167, y: 297, name: 'Nicaragua' },
  'BO': { x: 210, y: 380, name: 'Bolivia' },
  'PY': { x: 230, y: 400, name: 'Paraguay' },
  'UY': { x: 190, y: 470, name: 'Uruguay' },
  'GY': { x: 220, y: 310, name: 'Guyana' },
  'SR': { x: 210, y: 330, name: 'Suriname' },
  'GF': { x: 200, y: 310, name: 'French Guiana' },
  'EC': { x: 180, y: 330, name: 'Ecuador' },
  'MA': { x: 370, y: 220, name: 'Morocco' },
  'DZ': { x: 390, y: 220, name: 'Algeria' },
  'TN': { x: 405, y: 215, name: 'Tunisia' },
  'LY': { x: 410, y: 240, name: 'Libya' },
  'SD': { x: 480, y: 250, name: 'Sudan' },
  'ET': { x: 490, y: 330, name: 'Ethiopia' },
  'UG': { x: 475, y: 315, name: 'Uganda' },
  'RW': { x: 467, y: 325, name: 'Rwanda' },
  'BI': { x: 465, y: 320, name: 'Burundi' },
  'TZ': { x: 460, y: 370, name: 'Tanzania' },
  'MW': { x: 455, y: 390, name: 'Malawi' },
  'ZM': { x: 440, y: 390, name: 'Zambia' },
  'ZW': { x: 445, y: 410, name: 'Zimbabwe' },
  'BW': { x: 440, y: 430, name: 'Botswana' },
  'NA': { x: 420, y: 410, name: 'Namibia' },
  'AO': { x: 450, y: 400, name: 'Angola' },
  'CD': { x: 470, y: 350, name: 'Democratic Republic of the Congo' },
  'CG': { x: 450, y: 340, name: 'Congo' },
  'CM': { x: 420, y: 310, name: 'Cameroon' },
  'GA': { x: 430, y: 330, name: 'Gabon' },
  'GQ': { x: 425, y: 320, name: 'Equatorial Guinea' },
  'ST': { x: 415, y: 310, name: 'São Tomé and Príncipe' },
  'CV': { x: 350, y: 250, name: 'Cabo Verde' },
  'SN': { x: 380, y: 260, name: 'Senegal' },
  'GM': { x: 370, y: 270, name: 'Gambia' },
  'GN': { x: 370, y: 280, name: 'Guinea' },
  'GW': { x: 365, y: 285, name: 'Guinea-Bissau' },
  'SL': { x: 375, y: 275, name: 'Sierra Leone' },
  'LR': { x: 380, y: 285, name: 'Liberia' },
  'CI': { path: 'M 390 290 L 400 290 L 400 300 L 390 300 Z', x: 395, y: 295, name: 'Côte d\'Ivoire' },
  'GH': { x: 405, y: 280, name: 'Ghana' },
  'TG': { x: 385, y: 290, name: 'Togo' },
  'BJ': { x: 395, y: 295, name: 'Benin' },
  'NE': { x: 410, y: 270, name: 'Niger' },
  'ML': { x: 395, y: 270, name: 'Mali' },
  'BF': { x: 405, y: 285, name: 'Burkina Faso' },
  'TD': { x: 460, y: 260, name: 'Chad' },
  'CF': { x: 460, y: 300, name: 'Central African Republic' },
  'DJ': { x: 485, y: 310, name: 'Djibouti' },
  'ER': { x: 485, y: 340, name: 'Eritrea' },
  'SO': { x: 500, y: 320, name: 'Somalia' },
  'MG': { x: 520, y: 400, name: 'Madagascar' },
  'MU': { x: 502, y: 442, name: 'Mauritius' },
  'SC': { x: 492, y: 422, name: 'Seychelles' },
  'KM': { x: 475, y: 340, name: 'Comoros' },
  'YT': { x: 490, y: 410, name: 'Mayotte' },
  'RE': { x: 495, y: 420, name: 'Réunion' },
  'SH': { x: 340, y: 250, name: 'Saint Helena' },
  'AS': { x: 790, y: 340, name: 'American Samoa' },
  'UM': { x: 200, y: 250, name: 'U.S. Minor Outlying Islands' },
  'VI': { x: 230, y: 290, name: 'U.S. Virgin Islands' },
  'PR': { x: 226, y: 286, name: 'Puerto Rico' },
  'GU': { x: 771, y: 321, name: 'Guam' },
  'MP': { x: 795, y: 320, name: 'Northern Mariana Islands' },
  'PW': { x: 791, y: 321, name: 'Palau' },
  'FM': { x: 797, y: 342, name: 'Micronesia' },
  'MH': { x: 787, y: 332, name: 'Marshall Islands' },
  'KI': { x: 831, y: 361, name: 'Kiribati' },
  'NR': { x: 836, y: 351, name: 'Nauru' },
  'TV': { x: 811, y: 351, name: 'Tuvalu' },
  'TO': { x: 821, y: 391, name: 'Tonga' },
  'WS': { x: 827, y: 382, name: 'Samoa' },
  'FJ': { x: 825, y: 405, name: 'Fiji' },
  'VU': { x: 817, y: 412, name: 'Vanuatu' },
  'SB': { x: 815, y: 395, name: 'Solomon Islands' },
  'NC': { x: 807, y: 432, name: 'New Caledonia' },
  'PF': { x: 750, y: 450, name: 'French Polynesia' },
  'CK': { x: 740, y: 440, name: 'Cook Islands' },
  'NU': { x: 735, y: 435, name: 'Niue' },
  'TK': { x: 730, y: 430, name: 'Tokelau' },
  'PG': { x: 760, y: 400, name: 'Papua New Guinea' },
  'TL': { x: 700, y: 380, name: 'Timor-Leste' },
  'KH': { x: 655, y: 340, name: 'Cambodia' },
  'LA': { x: 645, y: 340, name: 'Laos' },
  'MM': { x: 635, y: 340, name: 'Myanmar' },
  'BN': { x: 680, y: 390, name: 'Brunei' },
  'MV': { x: 600, y: 360, name: 'Maldives' },
  'LK': { x: 605, y: 365, name: 'Sri Lanka' },
  'NP': { x: 585, y: 280, name: 'Nepal' },
  'BT': { x: 592, y: 275, name: 'Bhutan' },
  'MN': { x: 660, y: 180, name: 'Mongolia' },
  'KZ': { x: 585, y: 200, name: 'Kazakhstan' },
  'UZ': { x: 560, y: 235, name: 'Uzbekistan' },
  'TM': { x: 530, y: 235, name: 'Turkmenistan' },
  'KG': { x: 590, y: 210, name: 'Kyrgyzstan' },
  'TJ': { x: 565, y: 230, name: 'Tajikistan' },
  'AF': { x: 550, y: 235, name: 'Afghanistan' },
  'HK': { x: 692, y: 302, name: 'Hong Kong' },
  'MO': { x: 694, y: 304, name: 'Macao' },
  'TW': { x: 705, y: 330, name: 'Taiwan' },
  'KP': { x: 710, y: 220, name: 'North Korea' },
  'MN': { x: 660, y: 180, name: 'Mongolia' },
  'BT': { x: 592, y: 275, name: 'Bhutan' },
  'NP': { x: 585, y: 280, name: 'Nepal' },
  'LK': { x: 605, y: 365, name: 'Sri Lanka' },
  'MV': { x: 600, y: 360, name: 'Maldives' },
  'BN': { x: 680, y: 390, name: 'Brunei' },
  'SG': { x: 682, y: 382, name: 'Singapore' },
  'MY': { x: 665, y: 370, name: 'Malaysia' },
  'TH': { x: 665, y: 355, name: 'Thailand' },
  'VN': { x: 690, y: 350, name: 'Vietnam' },
  'KH': { x: 655, y: 340, name: 'Cambodia' },
  'LA': { x: 645, y: 340, name: 'Laos' },
  'MM': { x: 635, y: 340, name: 'Myanmar' },
  'PH': { x: 730, y: 335, name: 'Philippines' },
  'ID': { x: 710, y: 410, name: 'Indonesia' },
  'TL': { x: 700, y: 380, name: 'Timor-Leste' },
  'PG': { x: 760, y: 400, name: 'Papua New Guinea' },
  'AU': { x: 740, y: 450, name: 'Australia' },
  'NZ': { x: 810, y: 470, name: 'New Zealand' },
  'FJ': { x: 825, y: 405, name: 'Fiji' },
  'SB': { x: 815, y: 395, name: 'Solomon Islands' },
  'VU': { x: 817, y: 412, name: 'Vanuatu' },
  'NC': { x: 807, y: 432, name: 'New Caledonia' },
  'PF': { x: 750, y: 450, name: 'French Polynesia' },
  'CK': { x: 740, y: 440, name: 'Cook Islands' },
  'NU': { x: 735, y: 435, name: 'Niue' },
  'TK': { x: 730, y: 430, name: 'Tokelau' },
  'WS': { x: 827, y: 382, name: 'Samoa' },
  'TO': { x: 821, y: 391, name: 'Tonga' },
  'KI': { x: 831, y: 361, name: 'Kiribati' },
  'TV': { x: 811, y: 351, name: 'Tuvalu' },
  'NR': { x: 836, y: 351, name: 'Nauru' },
  'PW': { x: 791, y: 321, name: 'Palau' },
  'FM': { x: 797, y: 342, name: 'Micronesia' },
  'MH': { x: 787, y: 332, name: 'Marshall Islands' },
  'GU': { x: 771, y: 321, name: 'Guam' },
  'MP': { x: 795, y: 320, name: 'Northern Mariana Islands' },
  'AS': { x: 790, y: 340, name: 'American Samoa' },
  'UM': { x: 200, y: 250, name: 'U.S. Minor Outlying Islands' },
  'VI': { x: 230, y: 290, name: 'U.S. Virgin Islands' },
  'PR': { x: 226, y: 286, name: 'Puerto Rico' },
  'SH': { x: 340, y: 250, name: 'Saint Helena' },
  'AX': { x: 435, y: 140, name: 'Åland Islands' },
  'FO': { x: 400, y: 130, name: 'Faroe Islands' },
  'GL': { x: 380, y: 100, name: 'Greenland' },
  'IS': { x: 385, y: 105, name: 'Iceland' },
  'JE': { x: 395, y: 165, name: 'Jersey' },
  'GG': { x: 393, y: 163, name: 'Guernsey' },
  'IM': { x: 391, y: 161, name: 'Isle of Man' },
  'GI': { x: 398, y: 198, name: 'Gibraltar' },
  'MT': { x: 412, y: 195, name: 'Malta' },
  'CY': { x: 437, y: 217, name: 'Cyprus' },
  'AX': { x: 435, y: 140, name: 'Åland Islands' },
  'FO': { x: 400, y: 130, name: 'Faroe Islands' },
  'GL': { x: 380, y: 100, name: 'Greenland' },
  'IS': { x: 385, y: 105, name: 'Iceland' },
  'JE': { x: 395, y: 165, name: 'Jersey' },
  'GG': { x: 393, y: 163, name: 'Guernsey' },
  'IM': { x: 391, y: 161, name: 'Isle of Man' },
  'GI': { x: 398, y: 198, name: 'Gibraltar' },
  'MT': { x: 412, y: 195, name: 'Malta' },
  'CY': { x: 437, y: 217, name: 'Cyprus' }
};

// Color scheme for visa types
const VISA_COLORS = {
  'visa_free': '#22c55e',
  'evisa': '#f59e0b',
  'visa_on_arrival': '#fb923c',
  'required': '#ef4444'
};

function countryNameToIso2(countryName) {
  if (!countryName || typeof countryName !== 'string') return '';
  if (typeof COUNTRY_TO_ISO2 !== 'undefined' && COUNTRY_TO_ISO2[countryName]) {
    return COUNTRY_TO_ISO2[countryName];
  }
  return '';
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Create interactive world map
function createWorldMap(passportCountry, visaData) {
  const mapContainer = document.getElementById('visaMap');
  
  // Create SVG map
  const svgWidth = 900;
  const svgHeight = 500;
  
  let svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 900 500" style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <!-- Grid lines for better visualization -->
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Title -->
      <text x="450" y="30" text-anchor="middle" fill="white" font-size="18" font-weight="600">
        Visa Requirements Map
      </text>
      <text x="450" y="50" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14">
        ${passportCountry} Passport
      </text>
      
      <!-- Legend -->
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="15" height="15" fill="${VISA_COLORS.visa_free}" rx="2"/>
        <text x="20" y="12" fill="white" font-size="12">Visa-free</text>
        
        <rect x="0" y="20" width="15" height="15" fill="${VISA_COLORS.evisa}" rx="2"/>
        <text x="20" y="32" fill="white" font-size="12">eVisa/eTA</text>
        
        <rect x="0" y="40" width="15" height="15" fill="${VISA_COLORS.visa_on_arrival}" rx="2"/>
        <text x="20" y="52" fill="white" font-size="12">Visa on arrival</text>
        
        <rect x="0" y="60" width="15" height="15" fill="${VISA_COLORS.required}" rx="2"/>
        <text x="20" y="72" fill="white" font-size="12">Visa required</text>
      </g>
  `;
  
  // Add country circles
  Object.entries(WORLD_MAP_COUNTRIES).forEach(([iso2, country]) => {
    const countryName = country.name;
    
    // Determine visa category
    let category = 'required';
    if (visaData.visa_free.includes(countryName)) {
      category = 'visa_free';
    } else if (visaData.evisa.includes(countryName)) {
      category = 'evisa';
    } else if (visaData.visa_on_arrival.includes(countryName)) {
      category = 'visa_on_arrival';
    }
    
    const color = VISA_COLORS[category];

    // Use flag marker (emoji) instead of dots
    const realIso2 = countryNameToIso2(countryName) || iso2;
    const flag = typeof flagEmojiFromIso2 === 'function' ? flagEmojiFromIso2(realIso2) : '';
    const label = flag || realIso2;

    // Small pill background tinted by category, with flag in the center
    svgContent += `
      <g class="country-marker" data-country="${escapeXml(countryName)}" data-iso2="${escapeXml(realIso2)}" style="cursor: pointer;">
        <rect x="${(country.x - 11).toFixed(1)}" y="${(country.y - 11).toFixed(1)}" width="22" height="22" rx="6" fill="${color}" opacity="0.22" stroke="rgba(255,255,255,0.8)" stroke-width="1">
          <title>${escapeXml(countryName)} - ${escapeXml(category.replace(/_/g, ' '))}</title>
        </rect>
        <text x="${country.x}" y="${country.y + 6}" text-anchor="middle" font-size="16">${escapeXml(label)}</text>
      </g>
    `;
  });
  
  svgContent += '</svg>';
  
  mapContainer.innerHTML = svgContent;
  
  // Add click handlers
  const markers = mapContainer.querySelectorAll('.country-marker');
  markers.forEach(marker => {
    marker.addEventListener('click', function() {
      const countryName = this.getAttribute('data-country');
      const iso2 = this.getAttribute('data-iso2');
      
      // Determine category for this country
      let category = 'visa-required';
      if (visaData.visa_free.includes(countryName)) {
        category = 'visa-free';
      } else if (visaData.evisa.includes(countryName)) {
        category = 'evisa';
      } else if (visaData.visa_on_arrival.includes(countryName)) {
        category = 'visa-on-arrival';
      }
      
      showCountryDetails(countryName, category);
    });
    
    // Add hover effect
    marker.addEventListener('mouseenter', function() {
      const rect = this.querySelector('rect');
      if (rect) {
        rect.style.opacity = '0.35';
        rect.style.filter = 'brightness(1.15)';
      }
    });
    
    marker.addEventListener('mouseleave', function() {
      const rect = this.querySelector('rect');
      if (rect) {
        rect.style.opacity = '0.22';
        rect.style.filter = 'brightness(1)';
      }
    });
  });
}

// Export for use in visa-tool.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createWorldMap, WORLD_MAP_COUNTRIES, VISA_COLORS };
}
