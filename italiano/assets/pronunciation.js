/* Uppercase vowels mark stress positions, never dictionary spelling or keys.
   Existing Italian accents are preserved. Added acute marks are study hints. */
const ItalianPronunciation = (() => {
  const chapters = [
    'ciAo|buongiOrno|buonasEra|buonanOtte|arrivedErci|sAlve|grAzie|prEgo|per favOre|scUsa|scUsi|sì|nO|cOme|bEne|mAle|va bEne|mi chiAmo|piacEre|Ecco',
    'uOmo|dOnna|bambIno|ragAzzo|ragAzza|amIco|famIglia|mAdre|pAdre|fIglio|fIglia|fratEllo|sorElla|nOnna|nOnno|marIto|mOglie|nOme|signOra|gEnte',
    'Acqua|pAne|vIno|caffè|lAtte|tè|bIrra|pIzza|pAsta|formAggio|cArne|pEsce|frUtta|mEla|zUcchero|sAle|colaziOne|prAnzo|cEna|mangiAre',
    'cAsa|città|vIa|piAzza|negOzio|mercAto|staziOne|trEno|mAcchina|albErgo|cAmera|bAgno|pOrta|tAvolo|lEtto|chiEsa|strAda|bigliEtto|sinIstra|dEstra',
    'Essere|avEre|fAre|andAre|volEre|potEre|parlAre|capIre|bEre|Oggi|domAni|iEri|mOlto|pOco|grAnde|pIccolo|bEllo|buOno|dOve|quAnto',
    'Io|tU|lUi|lEi|nOi|vOi|lOro|quEsto|quEllo|mIo|tUo|chI|che cOsa|perché|quAndo|quI|Anche|mA|nOn|cOn',
    'Uno|dUe|trE|quAttro|cInque|sEi|sEtte|Otto|nOve|diEci|vEnti|cEnto|Ora|minUto|mEzzo|quArto|mattIna|pomerIggio|sEra|nOtte',
    'lavOro|uffIcio|scuOla|università|studEnte|insegnAnte|mEdico|impiegAto|lavorAre|studiAre|abitAre|lIngua|itAlia|italiAno|rUsso|inglEse|straniEro|nUmero|indirIzzo|bAnca',
    'lunedì|martedì|mercoledì|giovedì|venerdì|sAbato|domEnica|giOrno|settimAna|mEse|Anno|fIne settimAna|primavEra|estAte|autUnno|invErno|compleAnno|fEsta|sEmpre|mAi',
    'ristorAnte|bAr|menù|cOnto|piAtto|bicchiEre|forchEtta|coltEllo|cucchiAio|cameriEre|prImo|secOndo|dOlce|gelAto|verdUra|pOllo|rIso|uOvo|vorrEi|ordinAre',
    'tEmpo lIbero|spOrt|cAlcio|mUsica|fIlm|lIbro|cInema|mAre|montAgna|lEggere|scrIvere|giocAre|ascoltAre|guardAre|ballAre|cucinAre|uscIre|dormIre|mi piAce|insiEme',
    'appartamEnto|cucIna|soggiOrno|finEstra|sEdia|divAno|armAdio|frigorIfero|piAno|giardIno|chiAve|lUce|affItto|gAtto|vicIno|lontAno|sOpra|sOtto|dEntro|fuOri',
    'rOsso|biAnco|nEro|vErde|giAllo|blU|colOre|vestIto|magliEtta|pantalOni|scArpe|giAcca|bOrsa|tAglia|prEzzo|Euro|comprAre|costAre|cAro|econOmico',
    'tEmpo|sOle|piOggia|nEve|vEnto|cAldo|frEddo|piOvere|viAggio|vacAnza|aEreo|aeropOrto|Autobus|valIgia|mAppa|passapOrto|spiAggia|partIre|arrivAre|tornAre',
    'cOrpo|tEsta|Occhio|nAso|bOcca|dEnte|orEcchio|mAno|brAccio|gAmba|piEde|pAncia|farmacIa|medicIna|fEbbre|raffreddOre|malAto|stAnco|stAre|aiUto',
    'dIre|sapEre|conOscere|venIre|dAre|prEndere|vedEre|sentIre|aprIre|chiUdere|cercAre|trovAre|aspettAre|finIre|cominciAre|dovEre|pensAre|chiamAre|vIvere|ricordAre'
  ];
  const key = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const positions = new Map(chapters.flatMap(chapter => chapter.split('|').map(marked => [
    key(marked), [...marked.matchAll(/[AEIOU]/g)].map(match => match.index)
  ])));
  function word(text) {
    const stressed = positions.get(key(text));
    if (!stressed) return text;
    return [...text].map((letter, index) => stressed.includes(index) ? letter + '\u0301' : letter).join('');
  }
  function transcription(text) {
    if (!text) return '';
    let marked = false;
    const result = text.replace(/[А-ЯЁ]+/g, syllable => {
      const vowels = [...syllable.matchAll(/[АЕЁИОУЫЭЮЯ]/g)];
      if (!vowels.length) return syllable;
      marked = true;
      const index = syllable.includes('УО') ? syllable.indexOf('УО') + 1 : vowels[0].index;
      return syllable.slice(0, index + 1) + '\u0301' + syllable.slice(index + 1);
    });
    if (marked || /\s/.test(text)) return result;
    const vowels = [...text.matchAll(/[аеёиоуыэюя]/gi)];
    if (!vowels.length) return text;
    const index = vowels[vowels.length - 1].index;
    return text.slice(0, index + 1) + '\u0301' + text.slice(index + 1);
  }
  return { word, transcription, has: text => positions.has(key(text)), count: positions.size };
})();
if (typeof module !== 'undefined') module.exports = ItalianPronunciation;
