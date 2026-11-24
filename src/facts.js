export const labels = {
  location: ['Location & asset', 'Where did this happen?'],
  observed: ['What was observed', 'Record what you saw.'],
  completed: ['Work completed', 'Record work already done.'],
  next: ['Next shift', 'Record the requested follow-up.'],
};

export const fieldIds = Object.keys(labels);

export function attachEvidence(note, result) {
  return Object.fromEntries(fieldIds.map((field) => {
    const value = result[field].value.trim().slice(0, 450);
    const quote = result[field].quote.trim();
    const start = value && quote ? note.indexOf(quote) : -1;
    return [field, {
      value,
      range: start < 0 || note.indexOf(quote, start + 1) >= 0 ? null : [start, start + quote.length],
    }];
  }));
}

const sensitivePatterns = [
  ['email address', /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i],
  ['phone number', /(?:\+\d{1,3}[ .-]?)?(?:\(\d{2,4}\)|\d{2,4})[ .-]\d{3,4}[ .-]\d{3,4}\b/],
  ['access code', /\b(?:lockbox|door|gate|access)\s+(?:code|pin)\s*(?::|=|is)?\s*\d{3,}\b/i],
];

export function findCloudPrivacyFlags(facts) {
  return fieldIds.flatMap((field) => {
    const matches = sensitivePatterns.filter(([, pattern]) => pattern.test(facts[field]));
    return matches.map(([type]) => ({ field, type }));
  });
}
