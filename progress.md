Original prompt: Point & click adventura ve stylu Samorostu nad snímky webkamery z Klášterky (Zadní Planina, Krkonoše).
Ovce na louce chtějí lyžovat (snímek 2025-12-28_1300) → panáček jde po cestě, v každé chalupě úkol, až na vrch
Zadní Planiny (další úkol) → začne sněžit (tma + sněžení) → rozjede se vlek, ovce jezdí a lyžují 2026-01-05 09:00–15:45
→ vlek se zastaví, ovce odjedou. Zvuk a postavy dodá Daniel, do té doby panáčci z čárek.

## Rozhodnutí (2026-11-02)
- Čisté HTML + JS + Canvas 2D, bez frameworku a buildu; běží i z file:// (žádné ES moduly, žádný fetch).
- Svět 1920×1080 = pixely snímku; plátno se jen škáluje (letterbox). Mobil se řeší později.
- Hra beze slov (jen obrázky v bublinách). Jediný text je titulek „Klášterka“.
- Vypálené razítko kamery (vlevo nahoře) zakrývá HUD: batůžek a 7 míst na předměty, které odemknou mrak
  na Zadní Planině (2026-11-03 Daniel: datum a hodiny z menu pryč). Předmět vletí do batůžku, ten poskočí.
- Noc se nefotí (noční snímky šumí): ztmavený denní snímek (multiply) + hvězdy nad čarou obzoru
  + rozsvícená okna chalup + částicový sníh. Přechod podzim → zima se schová pod hustým sněžením.
- Detaily chalup kreslí Daniel (fotky kreseb s přírodními materiály). Zatím zástupné kresby na papíře;
  nakreslené pozadí se zapne polem `bg: 'assets/sceny/<id>.jpg'` ve specifikaci detailu v js/chalupy.js.
- Chalupy s úkolem: Skočka, Kantorská, Jelínek (chata č. 85), Nová Klínovka + boží muka = 5 klíčů k mraku.
  Spisovatel a Ranč úkol nemají (Daniel 2026-11-05, kód jejich detailů je v historii gitu), jen v noci svítí.
  Počet klíčů = počet položek v `K.CHALETS` (louka.js); podle něj se řídí batoh v HUD i bublina stromu.
- Les mezi dolní a horní loukou (2026-11-05, Daniel vybral variantu „zatoulaný beran“), `js/les.js`:
  otevře se sám, když panáček poprvé dojde na kraj lesa (skrytý úsek cesty, `K.forestSpan`); rozběhnutá
  chůze do chalupy po návratu pokračuje z druhého kraje. Cestou zpět je vyřešený a jen se projde.
  Starý strom s obličejem v kůře spí (Daniel 2026-11-06): 1. klik pootevře oči („nebuď mě“), 2. klik se
  probudí, 3. klik „co je?“ → panáček ukáže sníh → animovaná bublina (klíče naskočí do řady, zámek na mraku
  se otevře, sněží) → strom shodí z větve batoh. Do té doby jde klikat jen na strom a HUD je jen tmavý pruh
  přes razítko kamery (`K.state.bag`). Choroše na pařezu vyrostou po zídce jako schody,
  z převisu visí 5 rampouchů (voda, voda, kamenný roh, krk, mech) a jen ten nad krkem berana ho probudí.
  Beran se otřepe z mechu, postaví se, panáček po něm přejde a beran jde za stádem (`K.addRam`, `sh.ram`):
  na louce i ve finále má rohy do spirály a lyže se špičkou stočenou jako rohy.
  Pozadí = fotomontáž `assets/sceny/les.jpg` z Danielových fotek (`python tools/montaz_les.py`, zdroje v pics/,
  tvary vrstev = souřadnice z les.js): smrky v mlze P1240665, potok les/08.31.19, zídka a převis P1290149,
  kmen s obličejem DSC00882, listí les/08.30.23, tráva P1240669; spící beran má texturu mechu
  `les-mech.jpg` (P1240677). Rampouchy, hlíva, pařez, beran, obličej stromu a panáček se kreslí navrch.
  Bez načteného obrázku se kreslí papírová verze.
- Hrací místo i u božích muk nad Kantorskou (2026-11-04, Daniel): id `kriz` mezi chalupami s `druh: 'kriz'`
  (nekouří se, nesvítí). Poloha podle Daniela mapy.com/s/kufomadecu (50.7099203N, 15.6511865E), na snímku
  u osamělého smrčku vedle cesty (640, 302); cesta ve hře tudy vede po skutečné cestě. Fotky muk:
  pics/muka (gitignore). Pod křížem studánka, ze které teče voda do Kantorské. Zástupný úkol: odklidit
  3 smrkové větve ze studánky → voda teče trubkou ke Kantorské (rozsvítí se, Kantorka zamává) → natočit
  vodu do džbánku → předmět `voda`. Klik na kříž = Kristus se zaleskne.
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
- `js/teren.js` model terénu (vzdálenost od kamery v mřížce + OSM promítnutá do snímku) generuje
  `python tools/teren.py` (stahuje terén a OSM do tools/cache/, gitignore)
- `js/snimky.js` + `assets/frames/*.webp` generuje `python tools/snimky.py` z `pics/`
- `tools/testy.js` + `tools/test.ps1` skriptované průchody v headless Chromu

## Testování
Playwright tu nejde (firemní politika blokuje remote debugging), Node není. Místo toho:
1. `python tools/server.py` (port 8010, posílá `Cache-Control: no-store`; s obyčejným `http.server`
   prohlížeč míchal staré a nové JS a finále padalo na chybějící funkci)
2. `.\tools\test.ps1 -Query "test&skript=cela" -Out <png> -Budget 200000` → screenshot + řádek `STAV {...}`
- `?test` zastaví čas, testy ho posouvají přes `K.update`/`advanceTime`; rAF v testu kreslí jen občas.
- test.ps1 maže profil Chrome před každým během, jinak se načte starý JS z cache.
- `?les` = les už prošlý; skok do chalupy/vrcholu/finále ho přeskočí sám (`K.forestDone`).
- Scénáře: uvod, ovce, cesta (louka → les → Skočka), les/lesIntro/lesBeran/lesPrechod/lesKonec (`&scena=les`),
  skocka, kantorska, kriz/kriz2 (`&scena=kriz`), jelinek, klinovka, vrchol,
  finale (+ `&finale=<s>`), vlek, stopy (`&vse`), ptacek/odlet (`&scena=finale&finale=20`), daleko/daleko2 (panáček na horní louce), **cela** (celá hra až po titulek, ~100 s reálně).

## Stav
- [x] Celá hra průchozí od začátku do titulku (ověřeno scénářem `cela`).
- [ ] Daniel: doladit v editoru polohy chalup (jména jsou přiřazená odhadem!), cestu, vlek, chumel, obzor.
- [ ] Daniel: skutečné úkoly chalup a vrcholu; kresby detailů; postavy (ovce, panáček, chalupníci).
- [ ] Zvuky: soubory `assets/zvuky/<jméno>.mp3`. Používaná jména: bee, dvere, odmena, sustot, buch, spatne,
      zvonek, voda, ptak, tetrivek, poleno, ohen, mrak, vitr, vlek, vlek-stop; les: nebudme, vrzani (strom se
      probouzí), coje, chorose (rostou), triangl (padající kapka), chrapot (beran spí), beran (probouzí se), otrepani.
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
- Drobnosti (2026-11-04, Daniel vybral z Claudových nápadů): kouř z komínů hotových chalup (body `komin`
  u chalup, v editoru „komín“; ve finále se kouří ze všech šesti chalup), stopy panáčka v jinovatce (mizí za
  FOOTPRINT_LIFE = 25 s), na vršku sloupu vleku od rána sedí tetřívek obecný (Daniel 2026-11-04,
  `K.drawGrouse`): černomodrý, červená růže, bílý pruh na křídle, lyrovitý ocas; občas se otočí nebo toká
  (bílý vějíř), při rozjezdu vleku odletí nízko doleva (mávání střídá klouzání, zvuk `tetrivek`).
  Ovce a panáček se zatím neanimují víc — dostanou Danielovu definitivní podobu.
- Model terénu (2026-11-04, Daniel: použít polohu kamery a mapu údolí): `tools/teren.py` zkalibruje kameru
  (50.7052917N, 15.6433725E, 8 m nad zemí — odhad) podle 9 chalup známých z fotky i z OSM: natočení 56,3°
  (SV), zorný úhel 52°, odchylka ~14 px. Pak pro každých 20 px snímku spočítá vzdálenost viditelného terénu
  (Terrain Tiles z AWS, ~25 m data). `K.scaleAt(x, y)` = 15·d^−0,66 (0,06–1,25): dál = menší, ale pomaleji než
  ve skutečnosti, ať jsou vzdálené postavy vidět. Dřív jen podle y (tabulka `perspektiva`, zrušená) —
  Klínovka (1,1 km) a Spisovatel (0,6 km) tak byly stejně velké. Kontroly: vzdálenosti chalup sedí s mapou,
  sloup vleku vychází 8,5 m vysoký ve 194 m, trasa vleku z OSM jde přes jeho patu.
  Blízko kamery (přední louka) je model nejméně přesný: hrubý terén + odhad výšky kamery.
  Ve finále (zimní souřadnice) se před dotazem odečítá posun `snih`.
  Editor M = OSM cesty/potoky/vlek/chalupy promítnuté do snímku (tečkovaně = zakryté terénem).
  Jelínek = chata č. 85 (v OSM bez jména), potvrdil Daniel.
- Skok `?finale=<s>` nespouští časovače (tweeny), takže rychlost vleku/odjezd chumlu se v přetočeném
  stavu dopočítají až po skoku — jen ladicí kosmetika.
- Možné vylepšení: vrstvit skutečné noční snímky sněžení (01-03 03:00–06:00) slabě přes 'screen' jako texturu vánice.
