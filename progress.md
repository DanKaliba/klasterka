Original prompt: Point & click adventura ve stylu Samorostu nad snímky webkamery z Klášterky (Zadní Planina, Krkonoše).
Ovce na louce chtějí lyžovat (snímek 2025-12-28_1300) → panáček jde po cestě, v každé chalupě úkol, až na vrch
Zadní Planiny (další úkol) → začne sněžit (tma + sněžení) → rozjede se vlek, ovce jezdí a lyžují 2026-01-05 09:00–15:45
→ vlek se zastaví, ovce odjedou. Zvuk a postavy dodá Daniel, do té doby panáčci z čárek.
Příběh od 2026-11-09 (Daniel): strom v lese poradí zasadit na vrcholu sněžnou květinu; potřebuje 3 věci
(`K.ITEMS`): semínka (Kantorská), vodu (studánka u božích muk) a rampouch (les). Na vrcholu se zasadí,
vyroste, rozkvete a pyl z ní zasype Krkonoše jako sníh → finále.

## Rozhodnutí (2026-11-02)
- Čisté HTML + JS + Canvas 2D, bez frameworku a buildu; běží i z file:// (žádné ES moduly, žádný fetch).
- Svět 1920×1080 = pixely snímku; plátno se jen škáluje (letterbox). Mobil se řeší později.
- Hra beze slov (jen obrázky v bublinách). Jediný text je titulek „Klášterka“.
- Vypálené razítko kamery (vlevo nahoře) zakrývá HUD: batůžek a 3 místa na věci pro sněžnou květinu (2026-11-03 Daniel: datum a hodiny z menu pryč). Předmět vletí do batůžku, ten poskočí.
- Noc se nefotí (noční snímky šumí): ztmavený denní snímek (multiply) + hvězdy nad čarou obzoru
  + rozsvícená okna chalup + částicový sníh. Přechod podzim → zima se schová pod hustým sněžením.
- Detaily chalup kreslí Daniel (fotky kreseb s přírodními materiály). Zatím zástupné kresby na papíře;
  nakreslené pozadí se zapne polem `bg: 'assets/sceny/<id>.jpg'` ve specifikaci detailu v js/chalupy.js.
- Místa s úkolem na louce (`K.CHALETS` v louka.js): Kantorská (semínka) a boží muka (voda); rampouch je
  z lesa. Od 2026-11-09 nemají úkol Skočka, Jelínek a Nová Klínovka (jejich detaily s lyžemi, kolem a čajem
  v chalupy.js zůstaly a jdou otevřít přes `?scena=`; Daniel rozhodne, co s nimi), Spisovatel a Ranč úkol
  nemají od 2026-11-05 (kód v historii gitu). Všechny v noci svítí.
  Na vrchol se dá jít, až jsou v batohu všechny 3 věci; jinak bublina s tou, která chybí.
- Les mezi dolní a horní loukou (2026-11-05, Daniel vybral variantu „zatoulaný beran“), `js/les.js`:
  otevře se sám, když panáček poprvé dojde na kraj lesa (skrytý úsek cesty, `K.forestSpan`); rozběhnutá
  chůze do chalupy po návratu pokračuje z druhého kraje. Cestou zpět je vyřešený a jen se projde.
  Starý strom s obličejem v kůře spí (Daniel 2026-11-06): 1. klik pootevře oči („nebuď mě“), 2. klik se
  probudí, 3. klik „co je?“ (fraktura) → panáček ukáže sníh → herbář se sněžnou květinou (viz níže) →
  strom shodí z větve batoh. Dokud batoh nemá, HUD je jen tmavý pruh přes razítko
  kamery (`K.state.bag`). Batoh: ilustrace od Daniela (Gemini, 2026-11-10) → `assets/predmety/batoh.png` (`python tools/batoh.py` z
  `pics/batoh/batoh.jpg`), kreslí ho `K.drawIcon('batoh')`, na větvi visí za poutko. iStock fotka se nepublikuje.
  Les s rozbitou dřevěnou lávkou (Daniel 2026-11-08; převis ze zídky vypadal „rádoby počítačově“ a jako by
  nemohl stát; v Krkonoších jsou lávky pro pěší dřevěné). Na všechno jde klikat hned. Potok je ledový
  (u kraje se panáček otřese). Po kořenech stromu vyleze na lávku ze tří kmenů; povodeň utrhla její pravou
  půlku, na roztříštěném konci zavrávorá. Pravá opěra je holá a vysoká (z koryta se na ni vylézt nedá).
  První rampouch, nad kterým panáček dupne (kromě toho nad krkem berana), se utrhne a skočí do batohu
  (Daniel 2026-11-09), ale jen když už batoh má (oprava 2026-11-10). Ostatní jsou ve stínu větve s listím → dupnutí je jen rozechvěje. Klik na větev = stáhne ji
  do potoka (odplave, listí padá), vysvitne slunce (paprsek), rampouchy se zalesknou a teprve pak kapou.
  Beran spí v korytě pod mezerou zády k nám a má na sobě kůži balvanu z pozadí (`RAM_SKIN`), vykukují jen
  vršky rohů; spodek kryjí kameny před ním (`ROCKS`, překreslené pozadí). Rampouch nad krkem (x 1040) ho
  probudí: otřepe se, vstane, otočí se bokem, couvne a trkne do pravé opěry → prasklina, z vršku se
  sesypou kameny → souška na kraji opěry vrže (zvuk `strom-pada`, rána v `STROM_RANA` = 4,15 s) a padne
  doleva přes mezeru na konec lávky (výřez `les-souska.png` se otočí kolem kořenového krčku, prodlouží se
  na tvar z `les-po.jpg` a pak se na ten obrázek prolne; za ním záplata `les-za-souskou.png`); rampouchy se
  rozechvějí. Uražený beran odejde proti proudu do mlhy (`K.addRam`, `sh.ram`; na louce i ve finále má rohy do
  spirály a lyže se špičkou stočenou jako rohy). Rána probudí strom, pokud s ním panáček ještě nemluvil
  (dá batoh). Pak hráč pošle panáčka přes kmen na opěru a po schodech nahoru; bez rampouchu se zastaví na
  konci lávky a ukáže ho v bublině (utrhne si některý z rampouchů, které zůstaly).
  Pozadí = dva obrázky od Daniela (pics/les-lavka/A-pred.png a B-po.png, gitignore; prompty a náčrt
  kompozice v pics/podklady-les/PROMPT-most.md a C3-rozlozeni-lavka.png). `python tools/les_lavka.py` je
  zvětší na 1920×1080 (`les.jpg`, `les-po.jpg`) a vyřízne soušku podle rozdílu obou obrázků. Souřadnice
  v les.js (lávka `deckY`, rampouchy, beran, kameny, souška, obličej ve kůře `FACE`, batoh `BAG`, schody)
  jsou změřené na nich. Strom: oči a pusu dál kreslí hra tam, kde kůra obličej naznačuje.
  Potok teče: maska vody `les-voda.png` (`python tools/voda_les.py`, ručně obkreslené koryto minus šedé
  kameny), textura vody se posouvá dolů ke divákovi, dvě kopie se prolínají (`drawFlow`). Po výměně
  pozadí lesa je potřeba obkreslit koryto znovu.
  Starší pozadí (převis ze zídky, choroše po zídce, fotomontáž `les-montaz.jpg` + `les-mech.jpg` se skriptem
  tools/montaz_les.py) jsou jen v historii gitu.
  Bez načteného obrázku se kreslí zjednodušená papírová verze.
- Hrací místo i u božích muk nad Kantorskou (2026-11-04, Daniel): id `kriz` mezi chalupami s `druh: 'kriz'`
  (nekouří se, nesvítí). Poloha podle Daniela mapy.com/s/kufomadecu (50.7099203N, 15.6511865E), na snímku
  u osamělého smrčku vedle cesty (640, 302); cesta ve hře tudy vede po skutečné cestě. Fotky muk:
  pics/muka (gitignore). Pod křížem studánka, ze které teče voda do Kantorské. Zástupný úkol: odklidit
  3 smrkové větve ze studánky → voda teče trubkou ke Kantorské (rozsvítí se, Kantorka zamává) → natočit
  vodu do džbánku → předmět `voda`. Klik na kříž = Kristus se zaleskne.
- Vlek ve finále je „dokreslený fixou“ (Daniel 2026-11-09): lano i kotvy se chvějí v taktu K.boil, čárky na
  laně běží s ním, na vršku sloupu se točí dvě kladky (`drawLift`, `drawPulley` ve finale.js).
- Kantorská = kuchyně (2026-11-09, `js/kuchyne.js`): pozadí od Daniela podle fotky z Paseků 1916 (Album ze
  starých Krkonoš; prompt pics/podklady-kuchyne/PROMPT-kuchyne.md), podklady `python tools/kuchyne.py`.
  Verze 2 (2026-11-10): prázdná kuchyně z promptu A (`kuchyne-B.png`) a věci z promptu E (`veci-E.png`:
  volná hromádka roští u dveří, která po sebrání zmizí, náruč, hrnek, křížaly na tyči, které se v teple
  houpou a kocour o ně zavadí). Babka, její koš a děda jsou DOČASNĚ vyříznutí ze staré verze (`kuchyne-A.png`,
  GrabCut, `pip install opencv-python-headless`): jen dýchají, kašlou a babka se předkloní; čekají na pózy
  z promptů B a C. Kocour je zatím kreslený zástupce (prompt D).
  Úvod (Daniel 2026-11-10): v kuchyni je kouř (čadí z otevřených dvířek), babka s dědou kašlou → okno.
  Panáček na okno nedosáhne (bublina s pohrabáčem) → vezme pohrabáč z tyče sporáku (můj nápad), háčkem
  zachytí spodek křídla, přitáhne okno dovnitř, kouř vytáhne ven, pohrabáč vrátí. Pak jako dřív:
  děda vyfoukne kouř s nápovědou (květina → hrnek), panáček donese babce roští od dveří → oheň, hrnec se
  rozvaří, vůně vzbudí kocoura na kamnech → po polici dojde k hrnku a shodí ho do koše → semínka z koše
  do batohu → odchod dveřmi.
  Chybí zvuky: kasel, vrzani (okno), praskani, predeni, mnau, dymka, hrnek, semena, poklice, tuk (hra je tiše přeskočí).
- Úkoly ostatních chalup jsou ZÁSTUPNÉ. Vrchol (2026-11-09): panáček klikáním na hrudku hlíny dá semínka, zaleje ji
  a přiloží rampouch (věci přiletí z batohu) → květina (`kvetina.webp`) vyroste, rozzáří se, zvonky práší
  pyl, začne sněžit → finále. Kulisa vrcholu je zatím papírová.
- Veřejné repo https://github.com/DanKaliba/klasterka, hra na https://dankaliba.github.io/klasterka/ (Pages z main,
  od 2026-11-02). Práva k fotkám webkamery se ještě řeší; Daniel se rozhodl zveřejnit i tak.
- Push odsud: remote musí mít uživatele v URL (`https://DanKaliba@github.com/...`) a `GIT_TERMINAL_PROMPT=0`.

## Struktura
- `js/jadro.js` plátno, smyčka, časovače (`K.after/K.tween/K.until`), HUD, přechody, `advanceTime`
- `js/kresleni.js` zástupné kresby (panáček, ovce, chalupníci, zvířata, ikony, papír)
- `js/louka.js` hlavní scéna nad fotkou, cesta, ovce, přiblížení do chalupy
- `js/chalupy.js` detaily chalup + vrchol (malé stavové automaty)
- `js/kuchyne.js` kuchyně na Kantorské (semínka), `js/les.js` les s lávkou (rampouch)
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
- Scénáře: uvod, ovce, cesta (louka → les → Skočka), les/lesIntro/lesVoda/lesKonecLavky/lesVetev/lesSlunce/
  lesBeran/lesBokem/lesTrk/lesVrze/lesPad/lesLavka/lesOdchod/lesKonec (`&scena=les`),
  skocka, kantorska/kuchKasel/kuchOknoBez/kuchPohrabac/kuchHak/kuchVzduch/kuchDeda/kuchBabka/kuchPolice/kuchNesu/
  kuchPrilozi/kuchOhen/kuchKocour/kuchPolicka/kuchHrnek/kuchKos/kuchHotovo/kuchZpet
  (`&scena=kantorska`), kriz/kriz2 (`&scena=kriz`), jelinek, klinovka, vrchol,
  finale (+ `&finale=<s>`), vlek, stopy (`&vse`), ptacek/odlet (`&scena=finale&finale=20`), daleko/daleko2 (panáček na horní louce), **cela** (celá hra až po titulek, ~100 s reálně).

## Stav
- [x] Celá hra průchozí od začátku do titulku (ověřeno scénářem `cela`).
- [ ] Nový příběh (Daniel 2026-11-08): strom poradí zasadit sněžnou květinu, její modrobílé květy dozrají
      a zasypou pylem jako sněhem celé Krkonoše, květina zaroste celou Zadní Planinu. Hrdina potřebuje
      3 věci: vodu (studánka u kříže), semínka (kuchyně na Kantorské) a rampouch (z lesa; Daniel
      2026-11-09). Strom v lese už místo zamčeného mraku a klíčů ukazuje herbář (Danielův obrázek podle
      pics/podklady-kvetina/PROMPT-kvetina.md, `python tools/herbar.py` → herbar.jpg + herbar-vybledly.jpg):
      v kulaté bublině (jako ostatní bubliny stromu) se střídají kroky jeden po druhém přes celou bublinu:
      semínka, džbánek s vodou, rampouch, zasazení s klíčkem, květina roste odspodu, ze zvonku se snáší
      pyl jako sníh na hory (smyčka 11 s, `PLAN_STEPS` v les.js; výřezy z listu s rozmazanými okraji).
      Realistická květina na planinu (bílý náprstník se zvonky jako sněženka): `python tools/kvetina.py`
      → assets/sceny/kvetina.webp (celá rostlina), vyříznutá z šedého pozadí, roste na vrcholu. Detail klasu
      na přiblížení se dá vyříznout znovu (návod v tools/kvetina.py).
      Hra už běží podle nového příběhu (3 věci v HUD, zasazení na vrcholu); scénář `cela` prochází.
      Otázka stromu „?“ je kreslená tahem (drawAsk v les.js, tvar podle Danielovy předlohy): od kulatého
      konce dolů, pak hranatá tečka jednou zapulsuje; bublina trvá 1,9 s. Kroky po lávce a kmeni = kroky po trávě hlouběji a tišeji.
- [ ] Daniel: doladit v editoru polohy chalup (jména jsou přiřazená odhadem!), cestu, vlek, chumel, obzor.
- [ ] Daniel: skutečné úkoly chalup a vrcholu; kresby detailů; postavy (ovce, panáček, chalupníci).
- [ ] Zvuky: soubory `assets/zvuky/<jméno>.mp3`. Používaná jména: dvere, odmena, sustot, buch, spatne,
      zvonek, voda, ptak, tetrivek, poleno, ohen, mrak, vitr, vlek, vlek-stop; les: nebudme, vrzani (strom se
      probouzí), coje, triangl-1/2 (padající kapka, od Daniela), chrapot (beran spí), beran (probouzí se), otrepani,
      brr (ledová voda), vravorani (konec převisu), cinkani (rampouchy ve stínu / utržené), vetev, splouchnuti,
      slunce, frkani, trknuti, praskani, strom-pada (souška vrže a padne, od Daniela);
      louka: tetrivek-tokani (klik na tetřívka na sloupu).
      Chybějící soubor se tiše přeskočí. Hudba na pozadí zatím není.
- [x] Ovce (2026-11-08): `python tools/zvuky.py` převede Danielovy `sounds/sheep_1.wav`, `sheep_2.wav`
      na `ovce-1/2.mp3` (bečení po kliku na ovci na louce i ve finále, náhodně jedno z nich s mírně jinou
      výškou, hlasitost K.BLEAT_VOLUME = 0.4, `?ovce=`) a `sheep_flock.aiff` na `stado.mp3` (smyčka bez švu,
      62 s). Stádo hraje na pozadí, kde jsou ovce vidět (`scene.flock` v louce a ve finále do odjezdu chumlu),
      potichu pod kroky: K.FLOCK_VOLUME = 0.15 (Daniel), `?stado=`; mezi scénami se plynule ztiší / zesílí (K.loop).
      Jedna ovce (index 2, žlutá šála) je jehně: kreslí se menší (LAMB_SIZE 0.72 v louka.js, zatím jen
      zmenšená ovce do Danielovy kresby) a mečí `jehne.mp3` (ze `sounds/sheep_lamb.mp3`).
- [x] Kroky po zmrzlé trávě (2026-11-03): `assets/zvuky/krok-1..8.mp3` vystřihuje `python tools/kroky.py`
      z Danielova videa v `sounds/input/` (gitignore). Celé pásmo (verze jen s výškami nad 700 Hz zněla
      Danielovi nepřirozeně), ale potichu (K.STEP_VOLUME = 0.25, zkouší se `?kroky=0.4`), protože hra
      bude mít kytarový podkres a nesmí se to bít. Hrají při dopadu
      nohy jen na podzimní louce; vzdálený panáček a les jsou slabší, výška se náhodně mírně mění.
      Pořadí = zamíchaný balíček (bez opakování po sobě). Do každého 2./3. balíčku se přimíchá jeden
      krok po zmrzlé hlíně s ledem (`led-1..4.mp3`, první dva a poslední dva kroky videa, delší 0,4–0,8 s).
- [ ] Mobil (dotyk, orientace na šířku).
- [x] GitHub Pages nasazené (2026-11-02). Ověřeno: živý web běží, snímky se načítají.

- [x] 2026-11-06 (Daniel): tetřívek sedí na sloupu vleku už od začátku na louce (`K.drawPoleGrouse`, sloup je
      v zimních souřadnicích → na podzimní louce minus `K.L.snih`), klik = zatoká. Poslední ovce (`asksRam`) se
      ptá po beranovi (ikona `beran`), dokud není les vyřešený; úkoly chalup to neodemyká.
- [x] 2026-11-06 (Daniel): chůze kamkoli. `K.L.chuze` = plochy (dolní louka pod hranou lesa, horní louka u chalup;
      v editoru tyrkysově, B = nový bod, Del = smazat). Klik do plochy: v téže ploše jde panáček rovně, jinak se
      napojí na nejbližší bod cesty, jde po ní (lesem, přes lesní scénu) a z cesty zase rovně na místo
      (`K.hero.walkFree`, fronta úseků path/free/join). Do chalup a na vrchol dál po cestě. Test `chuze`.
      Minihra s tetřívkem se ještě vymyslí.
- Průhlednost postav: `K.withAlpha(ctx, a, fn)` nakreslí postavu naplno do vedlejšího plátna a zprůhlední ji
  jako celek (jinak prosvítají překrývající se chomáče/ovály). Používá drawHero, drawSheep (`o.alpha`) a beran.

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
