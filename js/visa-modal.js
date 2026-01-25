/**
 * Visa Country Details Modal
 * Shows detailed visa information when clicking on a country
 */

function showCountryDetails(passportCountry, destinationCountry, destinationIso2) {
  // Get ISO2 codes
  const passportIso2 = COUNTRY_TO_ISO2[passportCountry];
  const destIso2 = destinationIso2 || COUNTRY_TO_ISO2[destinationCountry];
  
  if (!passportIso2 || !destIso2) {
    alert('Country data not available');
    return;
  }

  // Get visa requirement
  const requirement = getVisaRequirement(passportIso2, destIso2);
  const visaType = normalizeDatasetRequirement(requirement);
  
  // Get detailed information
  let details = getVisaDetails(passportIso2, destIso2);
  if (!details) {
    details = generateDefaultDetails(requirement);
  }

  // Create modal HTML
  const modalHtml = `
    <div id="visaModal" class="visa-modal" style="
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
    ">
      <div class="visa-modal-content" style="
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
          <div class="row space" style="align-items: center">
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
                ${flagEmojiFromIso2(destIso2)} ${destinationCountry}
              </h2>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
                For ${flagEmojiFromIso2(passportIso2)} ${passportCountry} passport holders
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
            ${details.visaType}
          </div>

          <div class="visa-details-grid" style="display: grid; gap: 16px;">
            ${details.stayDuration ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Stay Duration</div>
                <div style="color: #6b7280;">${details.stayDuration}</div>
              </div>
            ` : ''}

            ${details.passportValidity ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Passport Validity</div>
                <div style="color: #6b7280;">${details.passportValidity}</div>
              </div>
            ` : ''}

            ${details.returnTicket !== undefined ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Return Ticket</div>
                <div style="color: #6b7280;">${details.returnTicket ? 'Required' : 'Not required'}</div>
              </div>
            ` : ''}

            ${details.proofOfFunds !== undefined ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Proof of Funds</div>
                <div style="color: #6b7280;">${details.proofOfFunds ? 'Required' : 'Not required'}</div>
              </div>
            ` : ''}

            ${details.processingTime ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Processing Time</div>
                <div style="color: #6b7280;">${details.processingTime}</div>
              </div>
            ` : ''}

            ${details.fee !== undefined ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Fee</div>
                <div style="color: #6b7280;">${typeof details.fee === 'number' ? '$' + details.fee : details.fee}</div>
              </div>
            ` : ''}

            ${details.healthRequirements && details.healthRequirements.length > 0 ? `
              <div class="visa-detail-item">
                <div style="font-weight: 500; color: #374151; margin-bottom: 4px;">Health Requirements</div>
                <div style="color: #6b7280;">${details.healthRequirements.join(', ')}</div>
              </div>
            ` : ''}

            ${details.notes ? `
              <div class="visa-detail-item" style="
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
            <div class="row" style="gap: 12px;">
              ${visaType === 'Visa-free' ? '' : `
                <button class="btn btn-primary" style="flex: 1;" onclick="startVisaApplication('${passportCountry}', '${destinationCountry}')">
                  Apply for Visa
                </button>
              `}
              <button class="btn" style="flex: 1;" onclick="closeVisaModal()">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);

  // Close on backdrop click
  document.getElementById('visaModal').addEventListener('click', function(e) {
    if (e.target.id === 'visaModal') {
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
  document.removeEventListener('keydown', closeVisaModal);
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

function startVisaApplication(passportCountry, destinationCountry) {
  closeVisaModal();
  // Redirect to visa application form or scroll to it
  const visaForm = document.querySelector('[data-visa-form]');
  if (visaForm) {
    visaForm.scrollIntoView({ behavior: 'smooth' });
    // Pre-fill the form
    const nationalitySelect = visaForm.querySelector('select[name="nationality"]');
    const destinationSelect = visaForm.querySelector('select[name="destination"]');
    if (nationalitySelect) nationalitySelect.value = passportCountry;
    if (destinationSelect) destinationSelect.value = destinationCountry;
  }
}

// Make functions globally available
window.showCountryDetails = showCountryDetails;
window.closeVisaModal = closeVisaModal;
window.startVisaApplication = startVisaApplication;
