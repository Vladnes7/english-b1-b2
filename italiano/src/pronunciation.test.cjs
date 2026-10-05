const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pronunciation = require('../assets/pronunciation.js');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, 'lessons.json'), 'utf8'));
const words = lessons.flatMap(lesson => lesson.words);
const strip = text => text.normalize('NFD').replace(/\p{M}/gu, '');
assert.equal(pronunciation.count, words.length, 'Stress map covers exactly the vocabulary');
for (const word of words) {
  assert.ok(pronunciation.has(word.en), `Missing stress: ${word.en}`);
  const display = pronunciation.word(word.en);
  assert.equal(strip(display), strip(word.en), `Dictionary spelling changed: ${word.en}`);
  assert.match(display.normalize('NFD'), /[\u0300\u0301]/u, `No visible stress: ${word.en}`);
  const ipa = pronunciation.transcription(word.ipa);
  assert.match(ipa, /[АЕЁИОУЫЭЮЯаеёиоуыэюя]\u0301/u, `No transcription stress: ${word.en}`);
  assert.equal(ipa.replace(/\u0301/g, ''), word.ipa, `Transcription letters changed: ${word.en}`);
}
assert.equal(pronunciation.word('uomo'), 'uo\u0301mo');
assert.equal(pronunciation.word('Italia'), 'Ita\u0301lia');
assert.equal(pronunciation.word('fine settimana'), 'fi\u0301ne settima\u0301na');
assert.equal(pronunciation.word('lunedì'), 'lunedì');
assert.equal(pronunciation.word('caffè'), 'caffè');
assert.equal(pronunciation.transcription('УО-мо'), 'УО\u0301-мо');
assert.equal(pronunciation.transcription('ЕУ-ро'), 'Е\u0301У-ро');
assert.equal(pronunciation.transcription('ФИ-не сет-ти-МА-на'), 'ФИ\u0301-не сет-ти-МА\u0301-на');
assert.equal(pronunciation.transcription('куи'), 'куи\u0301');
assert.equal(pronunciation.transcription('ми КЬЯ-мо'), 'ми КЬЯ\u0301-мо');
console.log(`OK: ${words.length} words, spelling preserved, Italian and transcription stress covered`);
