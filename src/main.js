import '@fontsource-variable/dm-sans';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@phosphor-icons/web/regular';
import './style.css';
import { extractOnDevice, generateBrief, liveConfigured } from './ai.js';
import { exampleNote, exampleFacts, labels } from './sample.js';

const icon = (name) => '<i class="ph ph-' + name + '" aria-hidden="true"></i>';
const app = document.querySelector('#app');
const template = (facts) => [
  ['What happened', [facts.location, facts.observed].filter(Boolean).join(' — ')],
  ['Work completed', facts.completed],
  ['Next shift', facts.next],
].map(([heading, text]) => heading + '\n' + (text || 'No information recorded.')).join('\n\n');

app.innerHTML = `
<header class="top"><div class="shell bar">
  <a class="brand" href="./" aria-label="Shiftproof home"><span>${icon('stack')}</span>Shiftproof</a>
  <div class="meta"><span id="network" role="status"></span><span id="mode"></span></div>
</div></header>
<main class="shell">
  <section class="hero">
    <div><p class="tag">${icon('hard-hat')} FACILITIES OPERATIONS</p><h1>Field handover</h1>
    <p>Capture what happened on shift. Review what the next crew needs.</p></div>
    <div class="diagram" aria-hidden="true"><div class="outline"><div class="unit"><span></span><span></span><span></span></div><div class="pipe"></div><div class="vent"></div></div></div>
  </section>
  <div class="toolbar">
    <div><h2>New handover</h2><p>From field note to a shareable shift brief.</p></div>
    <div class="toolbar-actions"><button class="ghost" id="sample">${icon('flask')} Load example</button><button class="ghost" id="clear">${icon('plus')} Start blank</button></div>
  </div>
  <div class="workspace">
    <section class="panel capture" aria-labelledby="capture-heading">
      <div class="panel-head"><div class="heading-icon">${icon('note-pencil')}</div><div><h3 id="capture-heading">Private field note</h3><p>Raw observations from the outgoing shift</p></div></div>
      <div class="capture-body">
        <label for="note">Shift notes</label>
        <textarea id="note" maxlength="3000" placeholder="Record what happened during your shift…"></textarea>
        <div class="caption"><span>${icon('lock-key')} Stays on this device</span><span id="count"></span></div>
        <div class="review-actions"><button class="primary" id="extract">${icon('cpu')} Extract on device</button><button class="ghost" id="live" hidden>Switch to live</button></div>
        <p class="assist" id="extract-status" role="status"></p>
      </div>
    </section>
    <section class="panel review" aria-labelledby="review-heading">
      <div class="panel-head"><div class="heading-icon">${icon('list-checks')}</div><div><h3 id="review-heading">Review shareable facts</h3><p>Check details and remove sensitive information</p></div></div>
      <div class="review-body">
        <div class="fields">${Object.entries(labels).map(([id, [label, placeholder]]) => `<div><label for="${id}">${label}</label><textarea id="${id}" rows="1" maxlength="450" placeholder="${placeholder}"></textarea></div>`).join('')}</div>
        <label class="consent"><input type="checkbox" id="consent"><span id="consent-copy"></span></label>
        <div class="review-actions"><button class="primary" id="generate">${icon('sparkle')} Generate brief</button><button class="ghost" id="format">${icon('file-text')} Format locally</button></div>
        <p class="assist" id="review-status" role="status"></p>
      </div>
    </section>
  </div>
  <section class="panel output" id="output" hidden aria-labelledby="output-heading">
    <div class="panel-head"><div class="heading-icon">${icon('clipboard-text')}</div><div><h3 id="output-heading" tabindex="-1">Shift brief</h3><p id="source"></p></div><div class="output-actions"><button class="ghost" id="copy">${icon('copy')} Copy</button><button class="ghost" id="download">${icon('download-simple')} Download</button></div></div>
    <pre id="brief"></pre>
    <p class="assist output-status" id="output-status" role="status"></p>
  </section>
  <footer><span>${icon('shield-check')} The original field note stays on your device.</span><span>Powered by Firebase AI Logic</span></footer>
</main>`;

const el = (id) => document.getElementById(id);
const note = el('note');
const consent = el('consent');
const fieldIds = Object.keys(labels);
let busy = false;
let sample = false;
let extractionSource = '';
let brief = '';

function facts() {
  return Object.fromEntries(fieldIds.map((field) => [field, el(field).value.trim()]));
}

function setFacts(values = {}) {
  for (const field of fieldIds) el(field).value = values[field] ?? '';
  consent.checked = false;
  clearOutput();
}

function clearOutput() {
  brief = '';
  el('output').hidden = true;
  el('output-status').textContent = '';
}

function render() {
  const hasFacts = Object.values(facts()).some(Boolean);
  el('network').innerHTML = navigator.onLine ? icon('wifi-high') + ' Online' : icon('wifi-slash') + ' Offline';
  el('mode').innerHTML = sample ? icon('flask') + ' Example mode' : liveConfigured ? icon('cpu') + ' Live inference' : icon('gear-six') + ' Firebase setup needed';
  el('consent-copy').textContent = sample
    ? 'I reviewed these fields and want to preview the brief.'
    : 'I reviewed these fields and allow them to be sent to Gemini in the cloud.';
  el('count').textContent = note.value.length + ' / 3,000';
  el('extract').disabled = busy || !note.value.trim() || (!sample && !liveConfigured);
  el('generate').disabled = busy || !hasFacts || !consent.checked || (!sample && !liveConfigured);
  el('format').disabled = busy || !hasFacts;
  el('consent').disabled = busy || !hasFacts;
  el('sample').disabled = busy;
  el('clear').disabled = busy;
  el('live').hidden = !sample || !liveConfigured;
  el('live').disabled = busy;
  note.readOnly = busy;
  for (const field of fieldIds) el(field).readOnly = busy;
}

function reset(useSample) {
  sample = useSample;
  note.value = useSample ? exampleNote : '';
  extractionSource = '';
  el('extract-status').textContent = useSample
    ? 'Example mode uses a saved extraction.'
    : liveConfigured ? 'First use may require a Gemini Nano download in Chrome.' : 'Try the example or record shareable facts manually.';
  el('review-status').textContent = '';
  setFacts();
  render();
}

function publish(text, source) {
  if (!text) throw new Error('An empty brief was returned. Try again or format locally.');
  brief = text;
  el('brief').textContent = brief;
  el('source').textContent = source;
  el('output').hidden = false;
  el('output-heading').focus();
}

async function run(status, work) {
  busy = true;
  render();
  try {
    await work();
  } catch (error) {
    el(status).textContent = error.message || 'The request failed. Try again.';
  } finally {
    busy = false;
    render();
  }
}

el('sample').onclick = () => reset(true);
el('live').onclick = () => {
  const example = note.value;
  reset(false);
  note.value = example;
  render();
  el('extract').focus();
};
el('clear').onclick = () => { reset(false); note.focus(); };
note.addEventListener('input', () => {
  if (sample) sample = false;
  if (extractionSource) setFacts();
  extractionSource = '';
  el('extract-status').textContent = liveConfigured ? '' : 'Try the example or record shareable facts manually.';
  el('review-status').textContent = '';
  render();
});

for (const field of fieldIds) el(field).addEventListener('input', () => {
  consent.checked = false;
  clearOutput();
  el('review-status').textContent = '';
  render();
});
consent.addEventListener('change', render);

el('extract').onclick = () => run('extract-status', async () => {
  el('extract-status').textContent = sample ? 'Loading saved example…' : 'Preparing Gemini Nano…';
  const extracted = sample ? exampleFacts : await extractOnDevice(note.value, (fraction) => {
    el('extract-status').textContent = 'Downloading Gemini Nano · ' + Math.round(fraction * 100) + '%';
  });
  setFacts(extracted);
  extractionSource = sample ? 'Saved example' : 'Gemini Nano · On-device verified';
  el('extract-status').textContent = extractionSource;
  el('review-status').textContent = '';
});

el('generate').onclick = () => run('review-status', async () => {
  clearOutput();
  const reviewed = facts();
  el('review-status').textContent = sample ? 'Loading example preview…' : 'Generating from reviewed fields…';
  const result = sample
    ? { text: template(reviewed), source: 'Example preview · No cloud request made' }
    : await generateBrief(reviewed);
  publish(result.text, result.source);
  el('review-status').textContent = '';
});

el('format').onclick = () => {
  el('review-status').textContent = '';
  publish(template(facts()), 'Local template · No AI request');
};

el('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(brief);
    el('output-status').textContent = 'Brief copied.';
  } catch {
    el('output-status').textContent = 'Clipboard unavailable. Use Download to save the brief.';
  }
};
el('download').onclick = () => {
  const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'shiftproof-handover.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
};

window.addEventListener('online', render);
window.addEventListener('offline', render);
reset(!liveConfigured);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./offline.js').catch(() => {});
}
