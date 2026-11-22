# Chybějící zvuky

Stav 2026-11-20. Hra volá zvuky jménem a hledá je v `assets/zvuky/<jméno>.mp3`. Když soubor chybí,
hra ho tiše přeskočí, takže zvuky se dají doplňovat po jednom. Stačí soubor uložit pod přesně tímto
jménem (malými písmeny, bez diakritiky). Hlasitost a výšku si hra nastavuje sama, ale krátký zvuk bez
ticha na začátku zní nejlíp.

**Už jsou (52 souborů).** Kde je víc variant, hra je losuje.
- Všude: `hudba` (podkresová smyčka, 2:16; pod každým zvukem hry se na chvíli ztiší, kroky a tiché
  zvuky ji nechají být; hlasitost 0,12; vše se ladí ve směšovači, klávesa M ve hře)
- Louka: `krok-1…8` (tráva), `led-1…4` (zmrzlá hlína), `ovce-1…2`, `jehne`, `stado` (smyčka),
  `dvere`, `tetrivek-tokani`
- Les: `strom-pada`, `vetev`, `splouchnuti`, `chrapot`, `otrepani`, `trknuti`, `triangl-1…2` (kapka,
  utržený i zmrzlý rampouch; cinkne i rampouch u květiny na vrcholu)
- Kuchyně: `kasel-1…3`, `ohen-1…2` (i Nová Klínovka), `tuk-1…2`, `dymka-1…2` (i studánka), `predeni`,
  `sustot` (roští; i studánka, vrchol a vedlejší scény), `poklice-1…3`, `mnau`
  (horká římsa kamen, shozený hrnek, leknutí na dědově hlavě)
- Studánka: `kyrie` (klik na Krista, sbor), `splouchnuti` (voda mezi prsty), `kvak` (vykoukne),
  `kvak-zly` (nafoukne se), `kvak-strach` (lekne se dýmu), `cvrk` (cvrkne do obličeje), `bublani`,
  `voda` (i zalití na vrcholu)
- Vrchol: `kaminek`, `tetrivek-tokani`, `chorose` (květina roste), `vitr` (rozfouká pyl)

Autoři a licence jsou v `podekovani.html` (odkaz „poděkování“ na konci hry). Nový zvuk z cizího zdroje
tam dopsat a jeho výřez přidat do `tools/zvuky.py`.

Celkem chybí **25 zvuků**: 23 v příběhu a 2 ve vedlejších scénách. Některé zazní na víc místech, proto
jsou ve více tabulkách.

## Všude

| Soubor | Kdy zní |
|---|---|
| `odmena` | věc doletí do batohu (voda, semínka); strom v lese dá batoh |

## Louka

Všechno hotové (`dvere`, `tetrivek-tokani`).

## Les (rampouch)

| Soubor | Kdy zní |
|---|---|
| `nebudme` | strom s obličejem se probouzí, zamručí „nebuďte mě“ (beze slov, jen bručení) |
| `vrzani` | strom se protahuje, vrzá dřevo (zní i v kuchyni při otevření okna) |
| `coje` | strom se ptá „co je?“, tázavé zabručení |
| `brr` | panáček se otřese zimou u kraje vody (u studánky po cvrknutí žáby, ve vyšší výšce) |
| `vravorani` | panáček vrávorá na lávce |
| `slunce` | slunce prosvitne mezi stromy, jemný zářivý tón (zní i na vrcholu při rozkvětu) |
| `beran` | mechem zarostlý beran se probouzí (zabečí hluboko) |
| `frkani` | beran frkne nosem, než se rozběhne |
| `praskani` | souše praskne |

## Kuchyně na Kantorské (semínka)

| Soubor | Kdy zní |
|---|---|
| `vrzani` | otevře se okno (viz les) |
| `lek` | děda se lekne kocoura (vyjeknutí) |
| `bruceni` | děda se zlobí na kocoura, co mu skočil na hlavu (vztekle zabručí) |
| `hrnek` | hrnek spadne z police |
| `buch` | hrnek dopadne do košíku |
| `semena` | semínka se vysypou do síta (sypání) |

## Studánka u božích muk (voda)

| Soubor | Kdy zní |
|---|---|
| `brr` | panáček se otřepe po cvrknutí (viz les) |
| `foukani` | panáček foukne oblak dýmu na žábu (dlouhé „fffú“) |
| `plesk` | žába doskočí do trávy (3× po sobě, plácnutí) |
| `nalevani` | voda teče do hrnku (asi 1,5 s, tón stoupá) |

## Vrchol (prosba o hrudku, oko bere s tetřívkem, zasazení sněžné květiny)

| Soubor | Kdy zní |
|---|---|
| `frkani` | tetřívek odmítne prosbu, zastraší kluka, prohraje kolo, lekne se Krakonoše (viz les) |
| `karta` | tetřívek nabídne hru; vytáhne kartu z ocasu a položí ji (lusknutí karty) |
| `prasknuti` | tetřívek zlomí svou rabuši, když prohraje kolo (praskne suché dřevo) |
| `tetrivek` | tetřívek se lekne Krakonoše (vyšší, krátce); poražený odletí (viz finále) |
| `slunce` | květina rozkvete (viz les) |

## Finále

| Soubor | Kdy zní |
|---|---|
| `vlek` | vlek se rozjede (může být delší, hraje při jízdě) |
| `vlek-stop` | vlek zastaví |
| `tetrivek` | tetřívek vzlétne, když se vlek rozjede (zafrkání křídel) |

## Vedlejší scény mimo příběh

Skočka, Jelínek a Nová Klínovka nemají od 2026-11-09 úkol, ale dají se otevřít přes `?scena=`.

| Soubor | Kdy zní |
|---|---|
| `ptak` | Jelínek: z keře vyletí pták |
| `poleno` | Nová Klínovka: panáček přiloží poleno |

(Používají i `buch`, ten je už v seznamu výše.)
