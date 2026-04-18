/**
 * Extended visa details dataset
 * Contains detailed information for visa requirements
 */

const VISA_DETAILS = {
  'US-CA': {
    visaType: 'visa free',
    stayDuration: '6 months',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'eTA required if flying',
    processingTime: 'Immediate',
    fee: 0
  },
  'US-MX': {
    visaType: 'visa free',
    stayDuration: '180 days',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'FMM tourist card free',
    processingTime: 'Immediate',
    fee: 0
  },
  'KE-UG': {
    visaType: 'visa free',
    stayDuration: '90 days',
    passportValidity: '6 months',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: ['Yellow fever'],
    notes: 'East African Community',
    processingTime: 'Immediate',
    fee: 0
  },
  'GB-FR': {
    visaType: 'visa free',
    stayDuration: '90 days/180 days',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'Brexit rules apply',
    processingTime: 'Immediate',
    fee: 0
  },
  'AU-US': {
    visaType: 'visa free',
    stayDuration: '90 days',
    passportValidity: 'Valid for duration',
    returnTicket: false,
    proofOfFunds: false,
    healthRequirements: [],
    notes: 'ESTA required',
    processingTime: '72 hours',
    fee: 21
  }
};

function getVisaDetails(passportIso2, destinationIso2) {
  const key = `${passportIso2}-${destinationIso2}`;
  return VISA_DETAILS[key] || null;
}

function generateDefaultDetails(requirement) {
  const req = String(requirement || '').toLowerCase();
  
  if (req.includes('visa free') || (!isNaN(req) && req !== '-1')) {
    return {
      visaType: 'Visa-free',
      stayDuration: !isNaN(req) ? `${req} days` : '90 days',
      passportValidity: '6 months beyond arrival',
      returnTicket: false,
      proofOfFunds: false,
      healthRequirements: [],
      notes: 'Verify with embassy',
      processingTime: 'Immediate',
      fee: 0
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
      notes: 'Obtain visa at port of entry',
      processingTime: 'On arrival',
      fee: 'Varies'
    };
  }

  if (req.includes('e-visa') || req.includes('eta')) {
    return {
      visaType: req.includes('eta') ? 'eTA' : 'eVisa',
      stayDuration: '30-90 days',
      passportValidity: '6 months beyond arrival',
      returnTicket: true,
      proofOfFunds: false,
      healthRequirements: [],
      notes: 'Apply online before travel',
      processingTime: '3-7 days',
      fee: 'Varies'
    };
  }

  return {
    visaType: 'Visa required',
    stayDuration: 'Varies',
    passportValidity: '6 months beyond arrival',
    returnTicket: true,
    proofOfFunds: true,
    healthRequirements: [],
    notes: 'Embassy visa required',
    processingTime: '10-30 days',
    fee: 'Varies'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VISA_DETAILS, getVisaDetails, generateDefaultDetails };
}
