# Chybějící zvuky

Stav 2026-11-23. Hra volá zvuky jménem a hledá je v `assets/zvuky/<jméno>.mp3`. Když soubor chybí,
hra ho tiše přeskočí, takže zvuky se dají doplňovat po jednom. Stačí soubor uložit pod přesně tímto
jménem (malými písmeny, bez diakritiky). Hlasitost a výšku si hra nastavuje sama, ale krátký zvuk bez
ticha na začátku zní nejlíp.

**Už jsou (125 souborů).** Kde je víc variant, hra je losuje.
- Hlas hrdiny (Andrea Kubisová): `hlas-hop-1…9` (výskok k oknu, k polici, přes kořeny), `hlas-jeste-1…6`
  („ještě jednu“), `hlas-staci-1…7` („stačí“), `hlas-vitezstvi-1…6` (porazí tetřívka; i odměna, když věc
  doletí do batohu), `hlas-snih-1…3` (odpoví stromu; poprosí tetřívka o hrudku), `hlas-smich-1…4` (zažene
  žábu dýmem), `hlas-brr-1…3` (zima u potoka; i u studánky po cvrknutí), `vlek` (smyčka ze tří pokusů,
  hraje celou dobu jízdy vleku)
- Hudba (Jan Odvárka): `hudba-louka` (od otevření hry, louka mezi chalupami), `hudba` (les), `hudba-finale` (závěr z webkamery), `hudba-kantorska-kour` → `-ohen` (rozhoří se oheň),
  `hudba-muka-zaba` → `-utekla` (žába uteče), `hudba-vrchol` → `-kytka` (tetřívek odletí); při změně se
  prolnou, pod každým zvukem hry se hudba na chvíli ztiší. Hlasitost 0,13, ladí se ve směšovači
  (klávesa M).
- Louka: `krok-1…8` (tráva), `led-1…4` (zmrzlá hlína), `ovce-1…2`, `jehne`, `stado` (smyčka), `dvere`,
  `tetrivek-tokani`
- Les: strom hlasem `nebudme`, `coje` a `hlas-strom-rec-1…7` (mluví nad herbářem), `vrzani-1…4` (strom se
  protahuje), `beran` (probudí se), `slunce-les` (kovové cinknutí, slunce prosvitne), `strom-pada`, `vetev`, `splouchnuti`, `chrapot`, `otrepani`,
  `trknuti`, `triangl-1…2` (kapka, utržený i zmrzlý rampouch; cinkne i rampouch u květiny na vrcholu)
- Kuchyně: `kasel-1…3`, `ohen-1…2` (i Nová Klínovka), `tuk-1…2`, `dymka-1…2` (i studánka), `predeni`,
  `sustot` (suchý keř; i studánka, vrchol a vedlejší scény), `poklice-1…3`, `okno` (vrzne), `pohrabac-dolu` a
  `pohrabac-na` (sundá a vrátí pohrabáč), `buch` (hrnek dopadne do košíku), `mnau` (horká římsa kamen, shozený hrnek, leknutí na dědově hlavě)
- Studánka: `kyrie` (klik na Krista, sbor), `splouchnuti` (voda mezi prsty), `kvak` (vykoukne), `kvak-zly`
  (nafoukne se), `kvak-strach` (lekne se dýmu), `cvrk` (cvrkne do obličeje), `bublani`, `voda` (i zalití
  na vrcholu), `nalevani` (do hrnku, tón stoupá)
- Vrchol: `karta-1…4` (lusknutí), `kaminek`, `tetrivek-tokani`, `tetrivek` (mávne křídly: lekne se
  Krakonoše, poražený odletí; i ve finále), `chorose` (květina roste), `slunce` (zvoneček, květina rozkvete), `vitr`
  (rozfouká pyl; i ve finále, když začne sněžit)

Autoři a licence jsou v `podekovani.html` (odkaz „poděkování“ na konci hry). Nový zvuk z cizího zdroje
tam dopsat a jeho výřez přidat do `tools/zvuky.py`.

Celkem chybí **13 zvuků**: 11 v příběhu a 2 ve vedlejších scénách. Některé zazní na víc místech, proto
jsou ve více tabulkách.

## Všude

Všechno hotové: odměna (věc doletí do batohu, strom dá batoh) hraje `hlas-vitezstvi-1…6`.

## Louka

Všechno hotové (`dvere`, `tetrivek-tokani`).

## Les (rampouch)

| Soubor | Kdy zní |
|---|---|
| `vravorani` | panáček vrávorá na lávce |
| `frkani` | beran frkne nosem, než se rozběhne |
| `praskani` | souše praskne |

## Kuchyně na Kantorské (semínka)

| Soubor | Kdy zní |
|---|---|
| `lek` | děda se lekne kocoura (vyjeknutí) |
| `bruceni` | děda se zlobí na kocoura, co mu skočil na hlavu (vztekle zabručí) |
| `hrnek` | hrnek spadne z police |
| `semena` | semínka se vysypou do síta (sypání) |

## Studánka u božích muk (voda)

| Soubor | Kdy zní |
|---|---|
| `foukani` | panáček foukne oblak dýmu na žábu (dlouhé „fffú“) |
| `plesk` | žába doskočí do trávy (3× po sobě, plácnutí) |

## Vrchol (prosba o hrudku, oko bere s tetřívkem, zasazení sněžné květiny)

| Soubor | Kdy zní |
|---|---|
| `frkani` | tetřívek odmítne prosbu, zastraší kluka, prohraje kolo, lekne se Krakonoše (viz les) |
| `prasknuti` | tetřívek zlomí svou rabuši, když prohraje kolo (praskne suché dřevo) |

## Finále

| Soubor | Kdy zní |
|---|---|
| `vlek-stop` | vlek zastaví |

## Vedlejší scény mimo příběh

Skočka, Jelínek a Nová Klínovka nemají od 2026-11-09 úkol, ale dají se otevřít přes `?scena=`.

| Soubor | Kdy zní |
|---|---|
| `ptak` | Jelínek: z keře vyletí pták |
| `poleno` | Nová Klínovka: panáček přiloží poleno |

(Používají i `buch` a `sustot`, ty už jsou.)
