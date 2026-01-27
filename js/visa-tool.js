/**
 * Visa Tool JavaScript
 * Matches AllAboutVisas.com functionality
 */

// Debug function to check if variables are loaded
function debugVariables() {
  console.log('VISA_COUNTRIES available:', typeof VISA_COUNTRIES !== 'undefined', VISA_COUNTRIES ? VISA_COUNTRIES.length : 'undefined');
  console.log('COUNTRY_TO_ISO2 available:', typeof COUNTRY_TO_ISO2 !== 'undefined');
  console.log('flagEmojiFromIso2 available:', typeof flagEmojiFromIso2 !== 'undefined');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  debugVariables();
  initVisaTool();
});

function initVisaTool() {
  const passportSelect = document.getElementById('passportSelect');
  const visaResults = document.getElementById('visaResults');
  if (!passportSelect) return;
  
  // Populate passport selector
  populatePassportSelector();
  
  // Add change event listener
  passportSelect.addEventListener('change', function() {
    const selectedPassport = this.value;
    if (selectedPassport) {
      showVisaResults(selectedPassport);
    } else {
      hideVisaResults();
    }
  });
}

function populatePassportSelector() {
  const passportSelect = document.getElementById('passportSelect');
  
  // Check if VISA_COUNTRIES is available
  if (typeof VISA_COUNTRIES === 'undefined') {
    console.error('VISA_COUNTRIES not loaded');
    passportSelect.innerHTML = '<option value="">Error loading countries</option>';
    return;
  }
  
  // Get sorted list of countries
  const sortedCountries = [...VISA_COUNTRIES].sort();
  
  console.log('Loading', sortedCountries.length, 'countries');
  
  // Clear existing options except placeholder
  passportSelect.innerHTML = '<option value="">Select a passport</option>';
  
  // Add options with flags
  sortedCountries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    
    const iso2 = COUNTRY_TO_ISO2[country];
    const flag = iso2 && typeof flagEmojiFromIso2 === 'function' ? flagEmojiFromIso2(iso2) : '';
    const label = flag ? `${flag} ${country}` : country;
    
    option.textContent = label;
    passportSelect.appendChild(option);
  });
  
  console.log('Passport selector populated with', passportSelect.options.length - 1, 'countries');
}

function showVisaResults(passportCountry) {
  const visaResults = document.getElementById('visaResults');
  const selectedPassportSpan = document.getElementById('selectedPassport');
  if (!visaResults) return;
  
  // Update selected passport display
  if (selectedPassportSpan) selectedPassportSpan.textContent = passportCountry;
  
  // Show results section
  visaResults.classList.add('active');
  visaResults.style.display = 'block';
  
  // Calculate visa requirements
  const visaData = calculateVisaRequirements(passportCountry);
  
  // Update statistics
  updateStatistics(visaData);
  
  // Update map
  updateMap(passportCountry, visaData);
  
  // Update country lists
  updateCountryLists(visaData);
}

function hideVisaResults() {
  const visaResults = document.getElementById('visaResults');
  if (!visaResults) return;
  visaResults.classList.remove('active');
  visaResults.style.display = 'none';
}

function calculateVisaRequirements(passportCountry) {
  const passportIso2 = COUNTRY_TO_ISO2[passportCountry];
  
  if (!passportIso2) {
    return {
      visa_free: [],
      evisa: [],
      visa_on_arrival: [],
      required: []
    };
  }
  
  const result = {
    visa_free: [],
    evisa: [],
    visa_on_arrival: [],
    required: []
  };
  
  // Go through all destinations
  VISA_COUNTRIES.forEach(destination => {
    if (destination === passportCountry) return; // Skip same country
    
    const destIso2 = COUNTRY_TO_ISO2[destination];
    if (!destIso2) return;
    
    // Get visa requirement from dataset
    const requirement = getVisaRequirement(passportIso2, destIso2);
    const visaType = normalizeDatasetRequirement(requirement);
    
    // Categorize
    switch (visaType) {
      case 'Visa-free':
        result.visa_free.push(destination);
        break;
      case 'eVisa':
      case 'eTA':
        result.evisa.push(destination);
        break;
      case 'Visa on arrival':
        result.visa_on_arrival.push(destination);
        break;
      default:
        result.required.push(destination);
    }
  });
  
  return result;
}

function updateStatistics(visaData) {
  document.getElementById('visaFreeCount').textContent = visaData.visa_free.length;
  document.getElementById('evisaCount').textContent = visaData.evisa.length;
  document.getElementById('visaOnArrivalCount').textContent = visaData.visa_on_arrival.length;
  document.getElementById('visaRequiredCount').textContent = visaData.required.length;
}

function updateMap(passportCountry, visaData) {
  const mapContainer = document.getElementById('visaMap');
  
  // Use the new world map
  if (typeof createWorldMap === 'function') {
    createWorldMap(passportCountry, visaData);
  } else {
    // Fallback to simple visualization
    const mapHtml = `
      <div style="width: 100%; height: 100%; position: relative; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🌍</div>
          <div style="font-size: 1.2rem; font-weight: 600;">Interactive Map</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">Showing ${visaData.visa_free.length + visaData.evisa.length + visaData.visa_on_arrival.length + visaData.required.length} destinations</div>
        </div>
        ${createMapDots(visaData)}
      </div>
    `;
    
    mapContainer.innerHTML = mapHtml;
  }
}

function createMapDots(visaData) {
  const dots = [];
  
  // Add dots for each category with different colors
  const addDots = (items, color) => {
    items.forEach((country, index) => {
      const x = 10 + (index * 3) % 80; // Simple positioning
      const y = 20 + (index * 2) % 60;
      dots.push(`<div style="position: absolute; left: ${x}%; top: ${y}%; width: 8px; height: 8px; background: ${color}; border-radius: 50%; title="${country}"></div>`);
    });
  };
  
  addDots(visaData.visa_free.slice(0, 20), '#22c55e');
  addDots(visaData.evisa.slice(0, 15), '#f59e0b');
  addDots(visaData.visa_on_arrival.slice(0, 10), '#fb923c');
  addDots(visaData.required.slice(0, 25), '#ef4444');
  
  return dots.join('');
}

function updateCountryLists(visaData) {
  // Update visa-free list
  updateCountryList('visaFreeList', visaData.visa_free, 'visa-free');
  
  // Update eVisa list
  updateCountryList('evisaList', visaData.evisa, 'evisa');
  
  // Update visa on arrival list
  updateCountryList('visaOnArrivalList', visaData.visa_on_arrival, 'visa-on-arrival');
  
  // Update visa required list
  updateCountryList('visaRequiredList', visaData.required, 'visa-required');
}

function updateCountryList(listId, countries, category) {
  const listElement = document.getElementById(listId);
  if (!listElement) return;

  // Force grid layout (prevents CSS overrides from breaking the layout)
  listElement.style.setProperty('display', 'grid', 'important');
  listElement.style.setProperty('grid-template-columns', 'repeat(auto-fill, minmax(160px, 1fr))', 'important');
  listElement.style.setProperty('gap', '12px', 'important');
  
  if (countries.length === 0) {
    listElement.style.setProperty('display', 'block', 'important');
    listElement.style.removeProperty('grid-template-columns');
    listElement.style.removeProperty('gap');
    listElement.innerHTML = '<div class="no-results">No destinations found</div>';
    return;
  }
  
  // Sort countries alphabetically
  const sortedCountries = [...countries].sort();
  
  // Create list items
  const listItems = sortedCountries.map(country => {
    const iso2 = COUNTRY_TO_ISO2[country];
    const flag = iso2 ? flagEmojiFromIso2(iso2) : '';
    
    return `
      <div class="country-item" onclick="showCountryDetails('${country}', '${category}')" title="Click for details">
        <span class="country-flag">${flag}</span>
        <span>${country}</span>
      </div>
    `;
  }).join('');
  
  listElement.innerHTML = listItems;
}

function showCountryDetails(country, category) {
  // Get passport country
  const passportCountry = document.getElementById('passportSelect').value;
  const passportIso2 = COUNTRY_TO_ISO2[passportCountry];
  const countryIso2 = COUNTRY_TO_ISO2[country];
  
  if (!passportIso2 || !countryIso2) return;
  
  // Get visa requirement
  const requirement = getVisaRequirement(passportIso2, countryIso2);
  const visaType = normalizeDatasetRequirement(requirement);
  
  // Get detailed information
  let details = getVisaDetails(passportIso2, countryIso2);
  if (!details) {
    details = generateDefaultDetails(requirement);
  }
  
  // Create modal
  createVisaModal(country, passportCountry, visaType, details);
}

function createVisaModal(country, passportCountry, visaType, details) {
  // Remove existing modal if any
  const existingModal = document.getElementById('visaModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const countryIso2 = COUNTRY_TO_ISO2[country];
  const passportIso2 = COUNTRY_TO_ISO2[passportCountry];
  const countryFlag = countryIso2 ? flagEmojiFromIso2(countryIso2) : '';
  const passportFlag = passportIso2 ? flagEmojiFromIso2(passportIso2) : '';
  
  const modal = document.createElement('div');
  modal.id = 'visaModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  const modalContent = `
    <div style="
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    ">
      <div style="
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
              ${countryFlag} ${country}
            </h2>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
              For ${passportFlag} ${passportCountry} passport holders
            </p>
          </div>
          <button onclick="closeVisaModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
          ">×</button>
        </div>
      </div>

      <div style="padding: 24px;">
        <div style="
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          ${getVisaTypeStyle(visaType)}
        ">
          ${visaType}
        </div>

        <div style="display: grid; gap: 16px;">
          ${details.stayDuration ? `
            <div>
              <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Stay Duration</div>
              <div style="color: #6b7280;">${details.stayDuration}</div>
            </div>
          ` : ''}

          ${details.passportValidity ? `
            <div>
              <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Passport Validity</div>
              <div style="color: #6b7280;">${details.passportValidity}</div>
            </div>
          ` : ''}

          ${details.returnTicket !== undefined ? `
            <div>
              <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Return Ticket</div>
              <div style="color: #6b7280;">${details.returnTicket ? 'Required' : 'Not required'}</div>
            </div>
          ` : ''}

          ${details.processingTime ? `
            <div>
              <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Processing Time</div>
              <div style="color: #6b7280;">${details.processingTime}</div>
            </div>
          ` : ''}

          ${details.fee !== undefined ? `
            <div>
              <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Fee</div>
              <div style="color: #6b7280;">${typeof details.fee === 'number' ? '$' + details.fee : details.fee}</div>
            </div>
          ` : ''}

          ${details.notes ? `
            <div style="
              background: #f9fafb;
              padding: 12px;
              border-radius: 8px;
              border-left: 3px solid #3b82f6;
            ">
              <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Important Notes</div>
              <div style="color: #6b7280; font-size: 14px;">${details.notes}</div>
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <div style="color: #6b7280; font-size: 12px; margin-bottom: 16px;">
            Visa requirements are subject to change. Always verify with the official embassy or consulate before travel.
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" style="flex: 1;" onclick="closeVisaModal()">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modal.innerHTML = modalContent;
  document.body.appendChild(modal);
  
  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeVisaModal();
    }
  });
  
  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeVisaModal();
    }
  });
}

function closeVisaModal() {
  const modal = document.getElementById('visaModal');
  if (modal) {
    modal.remove();
  }
}

function getVisaTypeStyle(visaType) {
  const styles = {
    'Visa-free': 'background: #dcfce7; color: #166534;',
    'eVisa': 'background: #fef3c7; color: #92400e;',
    'eTA': 'background: #fef3c7; color: #92400e;',
    'Visa on arrival': 'background: #fed7aa; color: #9a3412;',
    'Visa required': 'background: #fee2e2; color: #991b1b;'
  };
  return styles[visaType] || 'background: #f3f4f6; color: #374151;';
}

// Make functions globally available
window.showCountryDetails = showCountryDetails;
window.closeVisaModal = closeVisaModal;
