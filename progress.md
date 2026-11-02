Original prompt: Point & click adventura ve stylu Samorostu nad snímky webkamery z Klášterky (Zadní Planina, Krkonoše).
Ovce na louce chtějí lyžovat (snímek 2025-12-28_1300) → panáček jde po cestě, v každé chalupě úkol, až na vrch
Zadní Planiny (další úkol) → začne sněžit (tma + sněžení) → rozjede se vlek, ovce jezdí a lyžují 2026-01-05 09:00–15:45
→ vlek se zastaví, ovce odjedou. Zvuk a postavy dodá Daniel, do té doby panáčci z čárek.

## Rozhodnutí (2026-11-02)
- Čisté HTML + JS + Canvas 2D, bez frameworku a buildu; běží i z file:// (žádné ES moduly, žádný fetch).
- Svět 1920×1080 = pixely snímku; plátno se jen škáluje (letterbox). Mobil se řeší později.
- Hra beze slov (jen obrázky v bublinách). Jediný text je titulek „Klášterka“.
- Vypálené razítko kamery (vlevo nahoře) zakrývá HUD s hodinami a 6 sloty na předměty.
- Noc se nefotí (noční snímky šumí): ztmavený denní snímek (multiply) + hvězdy nad čarou obzoru
  + rozsvícená okna chalup + částicový sníh. Přechod podzim → zima se schová pod hustým sněžením.
- Detaily chalup kreslí Daniel (fotky kreseb s přírodními materiály). Zatím zástupné kresby na papíře;
  nakreslené pozadí se zapne polem `bg: 'assets/sceny/<id>.jpg'` ve specifikaci detailu v js/chalupy.js.
- Chalupy s úkolem: Spisovatel, Skočka, Kantorská, Ranč, Jelínek, Nová Klínovka. Ostatní jen svítí v noci.
- Úkoly v chalupách i na vrcholu jsou ZÁSTUPNÉ, skutečné vymyslí Daniel.
- Kód je samostatný repozitář (zatím jen lokálně, bez remote). Fotky webkamery: práva se řeší → nepublikovat.

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
1. `python -m http.server 8010` v kořeni projektu
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
- [ ] Mobil (dotyk, orientace na šířku).
- [ ] Publikace na GitHub Pages až po vyřešení práv k fotkám.

## Nápady / poznámky pro dalšího
- Zimní snímky jsou proti podzimním posunuté o ~(4, 16) px → `rozlozeni.snih`; v editoru S + šipky.
- Ve finále lze kliknout na lyžující ovci (kotrmelec). Vlek čeká na klik na budku v 9:00.
- Skok `?finale=<s>` nespouští časovače (tweeny), takže rychlost vleku/odjezd chumlu se v přetočeném
  stavu dopočítají až po skoku — jen ladicí kosmetika.
- Možné vylepšení: vrstvit skutečné noční snímky sněžení (01-03 03:00–06:00) slabě přes 'screen' jako texturu vánice.
