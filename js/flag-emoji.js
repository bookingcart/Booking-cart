/**
 * Flag emoji conversion utilities
 */

// Convert ISO2 country code to flag emoji
function flagEmojiFromIso2(iso2) {
  if (!iso2 || typeof iso2 !== 'string' || iso2.length !== 2) {
    return '';
  }
  
  const codePoints = [...iso2.toUpperCase()].map(char => {
    return 127397 + char.charCodeAt(0);
  });
  
  return String.fromCodePoint(...codePoints);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { flagEmojiFromIso2 };
}
