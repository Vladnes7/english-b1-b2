#!/usr/bin/env python3
"""Сборка: src/lessons.json + src/grammar.json → блок <script id="vocab"> в ../index.html.

Запуск из корня репозитория или из italiano/:  python3 italiano/src/build.py
Спряжения глаголов и артикли существительных вычисляются здесь — руками их не пишут.
Сборка падает с понятной ошибкой, если данные сломаны (см. check()).
"""
import json, os, re, sys, unicodedata

SRC = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(SRC, '..', 'index.html')

# Неправильные глаголы: io, tu, lui, noi, voi, loro
IRREG = {
    'essere':  'sono sei è siamo siete sono',
    'avere':   'ho hai ha abbiamo avete hanno',
    'fare':    'faccio fai fa facciamo fate fanno',
    'andare':  'vado vai va andiamo andate vanno',
    'volere':  'voglio vuoi vuole vogliamo volete vogliono',
    'potere':  'posso puoi può possiamo potete possono',
    'dovere':  'devo devi deve dobbiamo dovete devono',
    'bere':    'bevo bevi beve beviamo bevete bevono',
    'uscire':  'esco esci esce usciamo uscite escono',
    'stare':   'sto stai sta stiamo state stanno',
    'dare':    'do dai dà diamo date danno',
    'dire':    'dico dici dice diciamo dite dicono',
    'sapere':  'so sai sa sappiamo sapete sanno',
    'venire':  'vengo vieni viene veniamo venite vengono',
}
END = {'are': ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
       'ere': ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
       'ire': ['o', 'i', 'e', 'iamo', 'ite', 'ono']}


def conj(w):
    inf = w['en']
    if inf in IRREG:
        return IRREG[inf].split(), 'irr'
    stem, grp = inf[:-3], inf[-3:]
    if grp not in END:
        raise ValueError('не глагол: ' + inf)
    out = []
    for k, e in enumerate(END[grp]):
        s = stem
        if w.get('isc') and k in (0, 1, 2, 5):
            s += 'isc'
        # -care/-gare: h сохраняет звук перед i (cerchi, giochiamo)
        if grp == 'are' and s[-1:] in ('c', 'g') and e.startswith('i'):
            s += 'h'
        # -iare: mangi, studi, cominci — без двойного i
        if grp == 'are' and s.endswith('i') and e.startswith('i'):
            s = s[:-1]
        out.append(s + e)
    return out, ('isc' if w.get('isc') else grp)


def lo_word(x):
    """Слово требует lo/gli/uno (s+согласная, z, gn, ps, x, y)."""
    x = x.lower()
    return (x[0] == 's' and len(x) > 1 and x[1] not in 'aeiouàèéìòù') or x[0] in 'zxy' \
        or x[:2] in ('gn', 'ps', 'pn')


def vowel(x):
    return x[0].lower() in 'aeiouàèéìòùh'


def articles(w):
    g, sg, pl = w['g'], w['en'], w.get('pl')
    if w.get('only') == 'pl':
        pl, sg = sg, None
    res = {}
    if sg:
        if g == 'm':
            res['art'] = "l'" if vowel(sg) else 'lo' if lo_word(sg) else 'il'
            res['ind'] = 'uno' if lo_word(sg) else 'un'
        else:
            res['art'] = "l'" if vowel(sg) else 'la'
            res['ind'] = "un'" if vowel(sg) else 'una'
    if pl:
        pg = w.get('plg', g)
        if pg == 'm':
            res['artpl'] = 'gli' if (vowel(pl) or lo_word(pl)) else 'i'
        else:
            res['artpl'] = 'le'
        res['pl'] = pl
    return res


def strip_acc(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def check(lessons, grammar):
    errs, seen = [], {}
    gids = {g['id'] for g in grammar}
    for li, L in enumerate(lessons, 1):
        for gid in L['gram']:
            if gid not in gids:
                errs.append(f'урок {li}: нет темы грамматики «{gid}»')
        for w in L['words']:
            en = w['en']
            if en in seen:
                errs.append(f'«{en}» повторяется (уроки {seen[en]} и {li}) — en это ключ прогресса')
            seen[en] = li
            pat = r'(^|[^\w])' + re.escape(en) + r'(?!\w)'
            if not re.search(pat, w['sentence'], re.I | re.U):
                errs.append(f'урок {li}: в примере нет слова «{en}»: {w["sentence"]}')
            for k in ('ipa', 'ru', 'strans', 't'):
                if not w.get(k):
                    errs.append(f'урок {li}: у «{en}» нет поля {k}')
            if w.get('t') == 'n' and w.get('g') not in ('m', 'f'):
                errs.append(f'урок {li}: у существительного «{en}» нет рода g')
        if len(L['phrases']) < 5:
            errs.append(f'урок {li}: меньше 5 фраз')
    for g in grammar:
        if not (1 <= g['l'] <= len(lessons)):
            errs.append(f'тема {g["id"]}: нет урока {g["l"]}')
        for q in g.get('q', []):
            if q['a'] in q['o']:
                errs.append(f'тема {g["id"]}: верный ответ среди неверных: {q["q"]}')
    return errs


def main():
    lessons = json.load(open(os.path.join(SRC, 'lessons.json'), encoding='utf-8'))
    grammar = json.load(open(os.path.join(SRC, 'grammar.json'), encoding='utf-8'))
    errs = check(lessons, grammar)
    if errs:
        print('Ошибки в данных:\n  ' + '\n  '.join(errs))
        sys.exit(1)
    for L in lessons:
        for w in L['words']:
            if w['t'] == 'v' and not w.get('noconj'):
                w['conj'], w['vg'] = conj(w)
            if w['t'] == 'n':
                w.update(articles(w))
    data = json.dumps({'lessons': lessons, 'grammar': grammar}, ensure_ascii=False, separators=(',', ':'))
    data = data.replace('</', '<\\/')
    html = open(HTML, encoding='utf-8').read()
    new, n = re.subn(r'(<script id="vocab" type="application/json">)(.*?)(</script>)',
                     lambda m: m.group(1) + '\n' + data + '\n' + m.group(3), html, count=1, flags=re.S)
    if n != 1:
        sys.exit('не найден блок <script id="vocab"> в index.html')
    open(HTML, 'w', encoding='utf-8').write(new)
    nw = sum(len(L['words']) for L in lessons)
    nv = sum(1 for L in lessons for w in L['words'] if 'conj' in w)
    print(f'OK: {len(lessons)} уроков, {nw} слов, {sum(len(L["phrases"]) for L in lessons)} фраз, '
          f'{len(grammar)} тем грамматики, {nv} глаголов со спряжением')


if __name__ == '__main__':
    main()
