Original prompt: Point & click adventura ve stylu Samorostu nad snímky webkamery z Klášterky (Zadní Planina, Krkonoše).
Ovce na louce chtějí lyžovat (snímek 2025-12-28_1300) → panáček jde po cestě, v každé chalupě úkol, až na vrch
Zadní Planiny (další úkol) → začne sněžit (tma + sněžení) → rozjede se vlek, ovce jezdí a lyžují 2026-01-05 09:00–15:45
→ vlek se zastaví, ovce odjedou. Zvuk a postavy dodá Daniel, do té doby panáčci z čárek.

## Rozhodnutí (2026-11-02)
- Čisté HTML + JS + Canvas 2D, bez frameworku a buildu; běží i z file:// (žádné ES moduly, žádný fetch).
- Svět 1920×1080 = pixely snímku; plátno se jen škáluje (letterbox). Mobil se řeší později.
- Hra beze slov (jen obrázky v bublinách). Jediný text je titulek „Klášterka“.
- Vypálené razítko kamery (vlevo nahoře) zakrývá HUD: batůžek a 6 míst na předměty, které odemknou mrak
  na Zadní Planině (2026-11-03 Daniel: datum a hodiny z menu pryč). Předmět vletí do batůžku, ten poskočí.
- Noc se nefotí (noční snímky šumí): ztmavený denní snímek (multiply) + hvězdy nad čarou obzoru
  + rozsvícená okna chalup + částicový sníh. Přechod podzim → zima se schová pod hustým sněžením.
- Detaily chalup kreslí Daniel (fotky kreseb s přírodními materiály). Zatím zástupné kresby na papíře;
  nakreslené pozadí se zapne polem `bg: 'assets/sceny/<id>.jpg'` ve specifikaci detailu v js/chalupy.js.
- Chalupy s úkolem: Spisovatel, Skočka, Kantorská, Ranč, Jelínek, Nová Klínovka. Ostatní jen svítí v noci.
- Úkoly v chalupách i na vrcholu jsou ZÁSTUPNÉ, skutečné vymyslí Daniel.
- Veřejné repo https://github.com/DanKaliba/klasterka, hra na https://dankaliba.github.io/klasterka/ (Pages z main,
  od 2026-11-02). Práva k fotkám webkamery se ještě řeší; Daniel se rozhodl zveřejnit i tak.
- Push odsud: remote musí mít uživatele v URL (`https://DanKaliba@github.com/...`) a `GIT_TERMINAL_PROMPT=0`.

## Struktura
- `js/jadro.js` plátno, smyčka, časovače (`K.after/K.tween/K.until`), HUD, přechody, `advanceTime`
- `js/kresleni.js` zástupné kresby (panáček, ovce, chalupníci, zvířata, ikony, papír)
- `js/louka.js` hlavní scéna nad fotkou, cesta, ovce, přiblížení do chalupy
- `js/chalupy.js` detaily chalup + vrchol (malé stavové automaty)
- `js/finale.js` časová osa finále (klíče: snímek, noc, sníh, okna, hvězdy, vlek, události)
- `js/editor.js` editor rozložení (E), export do `js/rozlozeni.js` (C)
- `js/rozlozeni.js` souřadnice chalup, cesty, vleku, louky, obzoru, posun zimních snímků
- `js/snimky.js` + `assets/frames/*.webp` generuje `python tools/snimky.py` z `pics/`
- `tools/testy.js` + `tools/test.ps1` skriptované průchody v headless Chromu

## Testování
Playwright tu nejde (firemní politika blokuje remote debugging), Node není. Místo toho:
1. `python tools/server.py` (port 8010, posílá `Cache-Control: no-store`; s obyčejným `http.server`
   prohlížeč míchal staré a nové JS a finále padalo na chybějící funkci)
2. `.\tools\test.ps1 -Query "test&skript=cela" -Out <png> -Budget 200000` → screenshot + řádek `STAV {...}`
- `?test` zastaví čas, testy ho posouvají přes `K.update`/`advanceTime`; rAF v testu kreslí jen občas.
- test.ps1 maže profil Chrome před každým během, jinak se načte starý JS z cache.
- Scénáře: uvod, ovce, cesta, spisovatel, detail*, skocka, kantorska, ranc, jelinek, klinovka, vrchol,
  finale (+ `&finale=<s>`), vlek, **cela** (celá hra až po titulek, ~100 s reálně).

## Stav
- [x] Celá hra průchozí od začátku do titulku (ověřeno scénářem `cela`).
- [ ] Daniel: doladit v editoru polohy chalup (jména jsou přiřazená odhadem!), cestu, vlek, chumel, obzor.
- [ ] Daniel: skutečné úkoly chalup a vrcholu; kresby detailů; postavy (ovce, panáček, chalupníci).
- [ ] Zvuky: soubory `assets/zvuky/<jméno>.mp3`. Používaná jména: bee, dvere, odmena, sirka, svicka, psani,
      chrapot, sustot, buch, spatne, zvonek, vrzani, kopyta, rehtani, ptak, poleno, ohen, mrak, vitr, vlek, vlek-stop.
      Chybějící soubor se tiše přeskočí. Hudba na pozadí zatím není.
- [x] Kroky po zmrzlé trávě (2026-11-03): `assets/zvuky/krok-1..8.mp3` vystřihuje `python tools/kroky.py`
      z Danielova videa v `sounds/input/` (gitignore). Celé pásmo (verze jen s výškami nad 700 Hz zněla
      Danielovi nepřirozeně), ale potichu (K.STEP_VOLUME = 0.25, zkouší se `?kroky=0.4`), protože hra
      bude mít kytarový podkres a nesmí se to bít. Hrají při dopadu
      nohy jen na podzimní louce; vzdálený panáček a les jsou slabší, výška se náhodně mírně mění.
      Pořadí = zamíchaný balíček (bez opakování po sobě). Do každého 2./3. balíčku se přimíchá jeden
      krok po zmrzlé hlíně s ledem (`led-1..4.mp3`, první dva a poslední dva kroky videa, delší 0,4–0,8 s).
- [ ] Mobil (dotyk, orientace na šířku).
- [x] GitHub Pages nasazené (2026-11-02). Ověřeno: živý web běží, snímky se načítají.

## Nápady / poznámky pro dalšího
- Zimní snímky jsou proti podzimním posunuté o ~(4, 16) px → `rozlozeni.snih`; v editoru S + šipky.
- Vlek (2026-11-02, podle Daniela): stojí na skutečném sloupu z fotky. Body `vlek.*` a `hrana` jsou
  v souřadnicích ZIMNÍCH snímků (bez `snih` posunu). Černé lano jde po skutečných drátech od hrany (`dole`)
  přes podpěru (`sloup`) až za levý okraj (`nahore`); horní stanice s kladkami není vidět. Horní větev
  nahoru, dolní zpět. Ovce na kotvě jedou po odvrácené straně kopce (kreslí se oříznuté hranou `hrana`),
  zmizí vlevo, vjedou zpátky u `start` a sjíždějí obloučky pod spodní okraj (`sjezd`), odkud se znovu
  objeví zpoza hrany. Za lyžemi zůstává stopa, bledne za TRACK_LIFE = 10 s.
- Ve finále lze kliknout na lyžující ovci (kotrmelec). Vlek čeká v 9:00 na klik na sloup.
- Skok `?finale=<s>` nespouští časovače (tweeny), takže rychlost vleku/odjezd chumlu se v přetočeném
  stavu dopočítají až po skoku — jen ladicí kosmetika.
- Možné vylepšení: vrstvit skutečné noční snímky sněžení (01-03 03:00–06:00) slabě přes 'screen' jako texturu vánice.
