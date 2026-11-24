import assert from 'node:assert/strict';
import test from 'node:test';
import { attachEvidence, findCloudPrivacyFlags } from './facts.js';
import { exampleFacts, exampleNote } from './sample.js';

test('links each extracted value to its exact excerpt without exporting the note', () => {
  const draft = attachEvidence(exampleNote, exampleFacts);
  for (const [field, { value, range }] of Object.entries(draft)) {
    assert.equal(value, exampleFacts[field].value);
    assert.equal(exampleNote.slice(...range), exampleFacts[field].quote);
    assert.deepEqual(Object.keys(draft[field]), ['value', 'range']);
  }
});

test('withholds links for altered or non-unique quotes', () => {
  const draft = attachEvidence(exampleNote + ' ' + exampleFacts.completed.quote, {
    ...exampleFacts,
    next: { ...exampleFacts.next, quote: 'Please recheck the tray tomorrow.' },
  });
  assert.equal(draft.completed.range, null);
  assert.equal(draft.next.range, null);
});

test('flags common private details without flagging a normal equipment ID or time', () => {
  assert.deepEqual(findCloudPrivacyFlags({
    location: 'AHU-07 in the basement',
    observed: 'Observed at 20:05',
    completed: 'Called 202-555-0143 and emailed tech@example.com',
    next: 'Lockbox code: 4812',
  }), [
    { field: 'completed', type: 'email address' },
    { field: 'completed', type: 'phone number' },
    { field: 'next', type: 'access code' },
  ]);
});
