#!/usr/bin/env python3
"""Собирает nihongo/index.html из src/: шаблон + данные + скрипт. Запуск: python3 src/build.py"""
import json, pathlib

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent / 'index.html'

lessons = json.loads((SRC / 'lessons1.json').read_text()) + json.loads((SRC / 'lessons2.json').read_text())
extra = json.loads((SRC / 'extra.json').read_text())
data = {'lessons': lessons, 'grammar': json.loads((SRC / 'grammar.json').read_text()), **extra}

payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
app = (SRC / 'app1.js').read_text() + '\n' + (SRC / 'app2.js').read_text()
html = (SRC / 'template.html').read_text().replace('/*DATA*/', payload).replace('/*APP*/', app)
OUT.write_text(html)
print(f'{OUT} — {len(html.encode()) // 1024} КБ, уроков {len(lessons)}, слов {sum(len(l["words"]) for l in lessons)}')
