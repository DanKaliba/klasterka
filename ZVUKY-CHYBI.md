# Chybějící zvuky

Stav 2026-11-19. Hra volá zvuky jménem a hledá je v `assets/zvuky/<jméno>.mp3`. Když soubor chybí,
hra ho tiše přeskočí, takže zvuky se dají doplňovat po jednom. Stačí soubor uložit pod přesně tímto
jménem (malými písmeny, bez diakritiky). Hlasitost a výšku si hra nastavuje sama, ale krátký zvuk bez
ticha na začátku zní nejlíp.

**Už jsou:** `krok-1…8` (tráva), `led-1…4` (zmrzlá hlína), `ovce-1`, `ovce-2`, `jehne`, `stado`
(smyčka), `strom-pada`, `triangl-1`, `triangl-2`; od 2026-11-19 `tetrivek-tokani`, `dvere`, `kasel-1…3`
(hra losuje), `kaminek`, `ohen-1…2` (hra losuje; kuchyně i Nová Klínovka). Autoři a licence:
`podekovani.html` (odkaz „poděkování“ na konci hry); nový zvuk z cizího zdroje tam dopsat.

Celkem chybí **44 zvuků**: 42 v příběhu a 2 ve vedlejších scénách. Některé zazní na víc místech, proto
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
| `vetev` | panáček zatáhne za větev |
| `splouchnuti` | větev žuchne do potoka (u studánky voda proteče mezi prsty, potichu) |
| `slunce` | slunce prosvitne mezi stromy, jemný zářivý tón (zní i na vrcholu při rozkvětu) |
| `cinkani` | ťuknutí do zmrzlého rampouchu, cinknutí ledu (zní i na vrcholu) |
| `beran` | mechem zarostlý beran se probouzí (zabečí hluboko) |
| `chrapot` | klik na spícího berana, zachrápe |
| `otrepani` | beran se otřepe a mech z něj odletí |
| `frkani` | beran frkne nosem, než se rozběhne |
| `trknuti` | beran trkne do souše |
| `praskani` | souše praskne |

## Kuchyně na Kantorské (semínka)

| Soubor | Kdy zní |
|---|---|
| `vrzani` | otevře se okno (viz les) |
| `tuk` | pohrabáč ťukne o tyč, kocour doskočí, fajfka cvakne o zem (krátké ťuknutí dřeva) |
| `dymka` | děda bafne z fajfky (u studánky panáček bafne, ve vyšší hlasitosti) |
| `predeni` | kocour přede |
| `sustot` | šustění roští (zní i u studánky při vytahování větviček a na vrcholu) |
| `poklice` | poklice na hrnci cvaká, opakuje se každé 3–4 s, potichu |
| `mnau` | kocour zamňouká (protáhne se, lekne se) |
| `lek` | děda se lekne kocoura (vyjeknutí) |
| `bruceni` | děda se zlobí na kocoura, co mu skočil na hlavu (vztekle zabručí) |
| `hrnek` | hrnek spadne z police |
| `buch` | hrnek dopadne do košíku |
| `semena` | semínka se vysypou do síta (sypání) |

## Studánka u božích muk (voda)

| Soubor | Kdy zní |
|---|---|
| `sustot` | panáček vytáhne hromádku smrkových větviček |
| `kvak` | žába kvákne (vykoukne, nafoukne se, lekne se dýmu: hra mění výšku) |
| `cvrk` | žába cvrkne panáčkovi do obličeje (krátký stříkanec vody) |
| `brr` | panáček se otřepe po cvrknutí (viz les) |
| `dymka` | panáček dvakrát bafne z fajfky (viz kuchyně) |
| `foukani` | panáček foukne oblak dýmu na žábu (dlouhé „fffú“) |
| `plesk` | žába doskočí do trávy (3× po sobě, plácnutí) |
| `bublani` | uvolněný pramen probublá |
| `voda` | voda teče žlábkem (zní i na vrcholu při zalití květiny) |
| `splouchnuti` | voda proteče panáčkovi mezi prsty (viz les) |
| `nalevani` | voda teče do hrnku (asi 1,5 s, tón stoupá) |
| `zvonek` | klik na Krista na kříži, jemné zazvonění zvonečku |

## Vrchol (prosba o hrudku, oko bere s tetřívkem, zasazení sněžné květiny)

| Soubor | Kdy zní |
|---|---|
| `sustot` | kluk prosí o hrudku; zasazení semínek (viz kuchyně) |
| `frkani` | tetřívek odmítne prosbu, zastraší kluka, prohraje kolo, lekne se Krakonoše (viz les) |
| `karta` | tetřívek nabídne hru; vytáhne kartu z ocasu a položí ji (lusknutí karty) |
| `prasknuti` | tetřívek zlomí svou rabuši, když prohraje kolo (praskne suché dřevo) |
| `tetrivek` | tetřívek se lekne Krakonoše (vyšší, krátce); poražený odletí (viz finále) |
| `voda` | zalití (viz studánka) |
| `cinkani` | přiložení rampouchu (viz les) |
| `chorose` | květina roste (asi 3 s) |
| `slunce` | květina rozkvete (viz les) |
| `vitr` | vítr rozfouká pyl jako sníh |

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

(Používají i `sustot` a `buch`, ty jsou už v seznamech výše.)
