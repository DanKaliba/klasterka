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
  Bez zeptání ovcí (`K.state.asked`) do lesa nevejde (Daniel 2026-11-24): na kraji se zastaví na
  posledním viditelném bodu, otočí se a celé stádo se k němu otočí a zabečí, každá ovce po svém
  (náhodné pořadí, rozestupy 0,1–0,3 s; `K.forestRefused`, louka.js). Znovu zavolá nejdřív po 2,5 s.
  Testy: `lesNevi`, `lesNeviStado` (screenshot otočeného stáda), `lesNeviPakVi` (opakovaně ke kraji,
  pak zeptat a projít), `lesVi`. Všechna místa
  s úkolem jsou za lesem, takže les je vždy první. Start přes `?scena=` (mimo louku) nastaví `asked`.
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
  Pojistka (Daniel 2026-11-22): když je les prošlý a rampouch chybí, je na louce na kraji lesa bílý kruh;
  klik = panáček dojde k lesu a les se otevře ve stavu po beranovi (souška leží, beran pryč, strom vzhůru),
  takže si rampouch utrhne a přejde (louka.js `backToForest`, les.js `afterRam`, test `lesZpet3`).
  Zpátky (Daniel 2026-11-23): klik na levý kraj lesa = panáček odejde na dolní louku k ovcím; les zůstane
  nevyřešený a pamatuje si, co se v něm stalo (les.js `goBack`, `kept`; testy `lesZpatky`, `lesZpatky2`).
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
  pics/muka (gitignore). Pod křížem studánka, ze které teče voda do Kantorské.
  Studánka a žába (Daniel 2026-11-12), `js/muka.js` (scéna `kriz`): studánka je zanesená (3 hromádky
  smrkových větviček, listí a bahno), žlábkem neteče nic. Větvičky jde vytáhnout, po první vykouknou oči,
  po třetí je vidět žába, která sedí na vývěru a ucpává ho. Klik na žábu holou rukou: 1. se postaví na zadní
  a dělá se větší, 2. a další se otočí a cvrkne panáčkovi do obličeje; od 2. cvrknutí má panáček bublinu
  s fajfkou (můj nápad). Žábu zažene dědova fajfka z kuchyně (Daniel 2026-11-13: „hrdina začne kouřit fajfku
  a foukat dým na žábu, žábě kouř smrdí a odskáče pryč“; nahradilo hada z kořene, kořen ze scény zmizel).
  Point & click (Daniel 2026-11-13): hráč fajfku vytáhne z batůžku (klik na ni v HUD) a klikne s ní na žábu.
  Panáček si ji dá do pusy, dvakrát bafne, foukne dým na žábu, nad žábou se vlní smrad a třemi skoky uteče
  doleva. Pramen probublá, bahno a listí odplavou žlábkem, kal se rozplyne →
  hrnek z kuchyně (Daniel 2026-11-13: místo džbánku, scény na sebe navazují) se taky vytáhne z batůžku
  a klikne se s ním na konec žlábku; dokud neteče, hrnkem jen zatřese → předmět `voda` (hrnek z nástrojů
  zmizí) → odchod doprava. Klik na žlábek bez hrnku v ruce: panáček nastaví dlaně a voda mu proteče mezi
  prsty (můj nápad). Rozdělaná studánka si stav pamatuje i po odchodu.
  Žába: Danielův obrázek (kresba tuší + záda z fotky mokrého listu, prompt Z v pics/podklady-muka/PROMPT-zaba.md),
  `python tools/zaba.py` → assets/sceny/zaba-1..5.png a kotvy (FROG_ANCHOR). Póza 3 (cvrknutí) je z úpravy
  `zaba-Z2.jpeg` (2026-11-13); z ní se bere jen póza 3, protože Gemini při úpravě překreslil i pózu 4.
  Pozadí (2026-11-13, ChatGPT, prompt P v pics/podklady-muka/PROMPT-pozadi.md, varianta 2 `muka-P2.png`):
  `python tools/muka.py` → assets/sceny/muka.jpg + vrstvy muka-voda.png (přes čistou vodu z fotky hra kreslí
  kal, který se rozplyne, a znovu ji kreslí přes nohy žáby), muka-obruba.png (přední kameny), muka-stovik.png
  (šťovík v rohu, panáček jde za ním); levé horní rohy vrstev jsou v `LAYERS` v muka.js. Větvičky, listí na
  hladině, dým a panáček jsou kreslené.
  Klik na Krista = zaleskne se. Červený tulipán za ramenem kříže je podle Danielovy fotky (můj nápad v promptu).
- Vlek ve finále je „dokreslený fixou“ (Daniel 2026-11-09): lano i kotvy se chvějí v taktu K.boil, čárky na
  laně běží s ním, na vršku sloupu se točí dvě kladky (`drawLift`, `drawPulley` ve finale.js).
- Kantorská = kuchyně (2026-11-09, `js/kuchyne.js`): pozadí od Daniela podle fotky z Paseků 1916 (Album ze
  starých Krkonoš; prompt pics/podklady-kuchyne/PROMPT-kuchyne.md), podklady `python tools/kuchyne.py`.
  Verze 2 (2026-11-10): prázdná kuchyně z promptu A (`kuchyne-B.png`) a věci z promptu E (`veci-E.png`:
  volná hromádka roští u dveří, která po sebrání zmizí, náruč, hrnek, křížaly na tyči, které se v teple
  houpou a kocour o ně zavadí). Babčin koš je DOČASNĚ vyříznutý ze staré verze (`kuchyne-A.png`,
  GrabCut, `pip install opencv-python-headless`). Kocour je Danielův obrázek (2026-11-13, prompt KC v pics/podklady-postavy/PROMPT-postavy.md: kresba tuší,
  srst z jívových kočiček), `python tools/sprity.py` → assets/postavy/kocour-*.png; kreslený zůstal jako záloha.
  Kocour z obrázku je menší (CAT_K 0.72) a hrdina v kuchyni větší (HERO_S 1.9, dřív 1.3; výskok s pohrabáčem
  WIN_HOP a náruč roští se počítají z HERO_S), Daniel 2026-11-13. Děda se po skoku kocoura na hlavu nesměje,
  lekne se a zlobí se (hrozí pěstí, zvuk bruceni).
  Kocour (2026-11-23): papírová loutka (prompty KL1–KL4, díly kocourKL2–KL4, js/kocour.js, K.drawKocour),
  obrázky z KC zůstaly jako záloha. Tělo ze dvou dílů s nýtkem uprostřed zad, nohy ve dvou dílech (KL3 dalo
  celé nohy, fix_kl3 je rozdělí), ocas ze tří článků, pět hlav = výrazy, spí jako klubíčko (jeden díl).
  Pózy v st.cat.pose: sleep, stretch, walk, prep (přikrčí se a zavrtí zadkem před každým skokem), leap, sniff,
  sit, crouch (na dědově hlavě); krátké pohyby přes časy meowT (rozpálená římsa, hrnek), shakeT (otřepe si
  tlapku) a tapT (dvakrát ťukne do hrnku, pak ho shodí). Kocour je proto u dědy o ~2,5 s později (testy
  kuchPolicka/kuchHrnek/kuchHlava* posunuté). Ladění: ?scena=loutka&postava=kocour (&pohyb=…).
  Babka (2026-11-23): papírová loutka jako děda (prompty E1–E3, díly babkaE2 + babkaE3, js/babka.js), šátek
  z opravdové látky. Klečí: spodek v kleku je jeden díl, ohýbá se v pase, ruce v rameni, lokti a zápěstí
  (E2 dalo celé paže, fix_e2 je rozdělí v lokti). Čtyři hlavy = výrazy. Pózy (grannyPose): 1 kouká do ohně,
  2 kašle do kapesníku, 3 prosí o roští (dlaň nahoru), 4 natahuje ruce ke dvířkům (roští přiletí do dlaní,
  st.babka.hands), 5 spokojená (když hoří). Ladění: ?scena=loutka&postava=babka.
  Děda a babka sdílejí kostru sedících loutek js/loutky.js (K.sediciLoutka: podstavec, trup, hlava, ruce,
  u dědy nohy; kroky, chvění, přechody a stíny jako u hrdiny). `tools/postavy.py` už řeže jen fajfku.
  Děda (2026-11-22): papírová loutka na nýtech jako hrdina (prompty D1–D3, díly dedaD2 + dedaD3 v
  tools/sprity.py, kostra js/deda.js), vlasy a vous z lišejníku, sedí na stoličce. Pět hlav = výrazy;
  stavy (grandpaMode v kuchyne.js): kouri (fajfka v puse), bez (ruce na kolenou), kasel (předkloní se, pěst
  u pusy, fajfka ve druhé ruce), fouka (nápověda kouřem nahoru), lek (nadskočí, ruce nahoru), zlost (hrozí
  pěstí). Fajfku v dílech nemá: kreslí ji loutka stejným obrázkem `assets/predmety/fajfka.png`, který při
  leknutí vypadne z ruky na zem; pak má ruce prázdné a nekouří. K.drawDeda vrací pusu, temeno (kocour)
  a fajfku s víčkem (kouř). Ladění: ?scena=loutka&postava=deda.
  Nápověda od dědy (Daniel 2026-11-23, grandpaHint): kluk řekne „sníh“ (K.HLAS.snih + ikona), děda potáhne
  z dýmky (stav tah: fajfka u pusy, víčko se rozžhaví) a vyfukuje: tři malé obláčky jeden po druhém (každý
  vyletí z pusy, zvuk vydech-1…3), pak hlavní (vydech-dlouhy; syntetický šum z tools/vydech.py); v něm květina
  z herbáře (K.HERBAR, stejná jako na vrcholu), pak hrnek. Bez fajfky (po kocourovi) jen vyfoukne.
  Nástroje (2026-11-13, `K.TOOLS`, `K.giveTool` v jadro.js): hrnek a fajfka mají v HUD místa za klíči, bez
  kroužků, ikony jsou obrázky (kresleni.js `ICON_IMG`). Point & click (Daniel 2026-11-13): klik na nástroj
  v HUD ho vytáhne (`K.held`, ikona jede s kurzorem, v HUD zůstane bledý obrys), další klik do scény ho
  použije a vrátí do batůžku; znovu klik na nástroj nebo pravé tlačítko ho vrátí také. Všechny kliky jdou
  přes `K.click` (i v testech, krok `['klikNastroj', 'fajfka']`); scéna si `K.held` přečte hned na začátku
  svého click().
  Úvod (Daniel 2026-11-10): v kuchyni je kouř (čadí z otevřených dvířek), babka s dědou kašlou → okno.
  Panáček na okno nedosáhne (jen vyskočí; bez nápovědy a kroužků, Daniel 2026-11-10) → vezme pohrabáč z tyče sporáku (můj nápad), háčkem
  zachytí spodek křídla, přitáhne okno dovnitř, kouř vytáhne ven, pohrabáč vrátí. Pak jako dřív:
  děda vyfoukne kouř s nápovědou (květina → hrnek), panáček donese babce roští od dveří → oheň, hrnec se
  rozvaří, vůně vzbudí kocoura na kamnech → po polici dojde k hrnku a shodí ho do koše → vrátí se po polici
  a skočí dědovi na hlavu, děda se lekne a upustí fajfku (Daniel 2026-11-13) → kocour seskočí a přede, děda se
  směje → panáček sebere fajfku a z koše semínka (batoh) s hrnkem → až má všechno, odejde dveřmi.
  Chybí zvuky: kasel, vrzani (okno), praskani, predeni, mnau, dymka, hrnek, semena, poklice, tuk (hra je tiše přeskočí).
- Úkoly ostatních chalup jsou ZÁSTUPNÉ. Vrchol (`js/vrchol.js`, scéna `vrchol`): Daniel 2026-11-13 přidal
  tetřívka s ocasem z karet a jednodušší oko bere (návrh, balíček a prompty v pics/podklady-vrchol/PROMPT-vrchol.md).
  Po planině se chodí klikem na zem (pod WALK_Y). Dokud tetřívek sedí na hrudce, pustí kluka jen ke GUARD_X; když
  chce kluk dál, tetřívek vyskočí proti němu, nafoukne se a kluk vyděšeně couvne (test `vrcholStrach`).
  Příběh (Daniel 2026-11-18): klik na tetřívka (kluk nejdřív dojde na své místo vlevo od kamene) → kluk ho poprosí o hrudku (bublina s květinou z herbáře, jakou ukazuje
  strom), tetřívek odmítne (přeškrtnutá květina, zavrtí se) a nabídne hru (bublina s vějířem karet). Hraje se o místo:
  kluk vyhraje jedno kolo → tetřívek zlomí svou rabuši, karty mu vypadají z ocasu a odletí. Tetřívek vyhraje → zatoká,
  kluk ho může vyzvat znovu (už jen nabídka karet); remíza = hned další kolo. Na tahu je kluk: tlačítka karta s plusem
  (nebo klik na ocas) a dlaň = „stačí“. Tetřívek táhne do 17 (ješitně i dál, po každé své výhře víc). Mužík zatím
  nemá funkci (kamínky za kola zrušené, Daniel vymyslí jinou). Krakonoš u kluka: tetřívek se lekne (vyskočí, třese
  se, uletí mu pírka). Balíček 18 karet (černá zvířata, červené rostliny,
  bílá povolání; král 2, eso 11) + Krakonoš jako žolík (1 nebo 11). V testu (?test) se míchá se semínkem;
  krok testu `['vrcholHraj']` odehraje hru za kluka. Pak jako dřív: na hrudku semínka, voda, rampouch
  (věci přiletí z batohu) → květina (`kvetina.webp`) vyroste, rozzáří se, práší pyl, sněží → finále.
  Tetřívek je Danielův obrázek (2026-11-13, prompt T, pics/podklady-vrchol/tetrivek-T.png, python tools/sprity.py:
  pózy sit / display / pluck / sulk / fly). Karty jsou Danielovy obrázky (prompt KA, karty-zvirata.png a
  karty-rostliny-povolani.png): fix_karty v tools/sprity.py z rohů vygumuje puntíky (Gemini je kreslí špatnou
  barvou a počtem) a hra je dokreslí sama. Rub karty (pera) je Danielův obrázek
  (prompt KR, rub-rabuse.png). Rabuše jsou grónské dřevěné mapy (Daniel 2026-11-18, prompt KR2, rabuse-KR2b.png;
  sprity.py: rabuse2 = celá s 22 zuby změřenými v knobs, zlomené kusy, kamínek): s každou kartou tetřívek hodí
  zobákem kamínek na zub podle součtu; přes 21 se kamínek skutálí do trávy. Když tetřívek prohraje kolo, klovne
  do své rabuše a zlomí ji (ukážou se zlomené kusy). Test `vrcholPrask` ukáže spadlý kamínek a zlomenou rabuši.
  Krakonoš (žolík) je Danielův obrázek (2026-11-18, prompt KK, karta-krakonos-KK.png): Rübezahl podle
  Helwigovy mapy (1561), paroží z větviček kleče; v rozích hra kreslí hnědý puntík v kroužku (1 nebo 11).
  Pozadí je Danielův obrázek (2026-11-18, prompt V, pics/podklady-vrchol/vrchol-V.png): `python tools/vrchol.py`
  → assets/sceny/vrchol.jpg a vrstva vrchol-hrudka.png (ztmavená hrudka, prolne se po zalití). Mužík, plochý
  kámen a hrudka jsou v pozadí; hra na ně kreslí jen kamínky, karty, rabuše a květinu.
- Poděkování (Daniel 2026-11-19): na konci hry pod nápisem Klášterka odkaz „poděkování“ (js/finale.js THANKS) otevře
  podekovani.html v nové záložce: bouda Klášterka za webkameru, autoři a licence zvuků (Freesound), značka K, Helwig.
  Nový zvuk nebo obrázek z cizího zdroje tam dopsat.
- Veřejné repo https://github.com/DanKaliba/klasterka, hra na https://dankaliba.github.io/klasterka/ (Pages z main,
  od 2026-11-02). Práva k fotkám webkamery se ještě řeší; Daniel se rozhodl zveřejnit i tak.
- Push odsud: remote musí mít uživatele v URL (`https://DanKaliba@github.com/...`) a `GIT_TERMINAL_PROMPT=0`.

## Struktura
- `js/jadro.js` plátno, smyčka, časovače (`K.after/K.tween/K.until`), HUD, přechody, `advanceTime`
- `js/kresleni.js` zástupné kresby (panáček, ovce, chalupníci, zvířata, ikony, papír); ovce z obrázku (`K.sprite`)
- `js/sprity.js` pózy postav z obrázků (kocour, ovce: zdroj, kotva, směr) generuje `python tools/sprity.py`
  z pics/podklady-postavy/ (Daniel 2026-11-13: kocour KC; ovce jako loutka z dílů OV2b)
  Ovce (kresleni.js drawSheepSprite): tělo z kotrče + hlava z obrázku, nohy tuší kreslí hra (chůze, lyže),
  hlava se při pasení skloní kolem krku; jehně a beran mají vlastní díly.
  Hrdina (2026-11-22): kluk v klobouku z alba jako papírová loutka na mosazných nýtcích (prompty L1–L3,
  díly hrdinaL2 + hrdinaL3; klobouk z troudnatcové plsti, obličej pod krempou). Kostra v kresleni.js
  (LOUTKA = klouby dílů jako podíly obrázku): krk, rameno, loket, zápěstí, kyčel, koleno, kotník, klobouk
  volně na hlavě. Póza = úhly kloubů; pohyby: stoj (dýchá, po 3 s drobnosti: podrbe se pod kloboukem,
  nadzvedne krempu, otře si chodidlo o lýtko, kouká nahoru), chůze (8 kroků na dvojkrok, odraz z palce,
  ruce se klátí), o.reach (na špičkách), o.wave, o.arm 'hold' / 'mouth' (fajfka pod krempou), o.face
  'startle' (vyskočí, klobouk vyletí a dopadne do očí; pak si ho srovná) a 'wet' (schoulí se, drží krempu;
  pak se otřepe). Papírový dojem: póza po krocích 12× za s, kloub každý krok trochu ujede, předloktí,
  ruka a klobouk při přechodu dobíhají, otočka přes hranu kartonu, stín každého dílu. K.heroHand
  a K.heroMouth dávají polohu ruky a pusy podle zobrazené pózy. Výška loutky = 150 * s jako dřív,
  panáček z čar zůstal jako záloha. Ladění: ?scena=loutka (&pohyb=…), testy loutka* v tools/testy.js.
  Beran v lese (les.js): bokem je loutka berana (drawRamSideSprite, čumák na místě kresleného),
  zezadu kreslená hlava a rohy, tělo vyplněné kotrčem z dílu; obrázky zezadu čekají na prompt OV3.
- `js/louka.js` hlavní scéna nad fotkou, cesta, ovce, přiblížení do chalupy
- `js/chalupy.js` detaily chalup (malé stavové automaty); `js/vrchol.js` vrchol (oko bere s tetřívkem, květina)
- `js/kuchyne.js` kuchyně na Kantorské (semínka), `js/muka.js` studánka u božích muk (voda), `js/les.js` les s lávkou (rampouch)
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
  (`&scena=kantorska`), kriz/krizOci/krizZaba/krizVelka/krizCvrk/krizDym/krizSmrad/krizUtek/krizCista/krizSucho/krizNalevani/krizHotovo (`&scena=kriz`), krizBezFajfky/krizDlane (`&scena=kriz&bezHrnku`), jelinek, klinovka, vrchol,
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
      louka: tetrivek-tokani (klik na tetřívka na sloupu);
      studánka: kvak, cvrk, dymka (bafnutí z fajfky), foukani (fouknutí dýmu), plesk (skok žáby), bublani,
      nalevani, splouchnuti, brr, sustot, voda, zvonek.
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
- Zvuk `foukani` u studánky (kluk fouká kouř na žábu, muka.js) nemá soubor, je ticho. Daniel 2026-11-23:
  kluk musí dýchat jinak než děda (vydech-* z kuchyně nepoužívat), nižší priorita.
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
