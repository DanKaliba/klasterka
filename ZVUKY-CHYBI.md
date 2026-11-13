# Chybějící zvuky

Stav 2026-11-13. Hra volá zvuky jménem a hledá je v `assets/zvuky/<jméno>.mp3`. Když soubor chybí,
hra ho tiše přeskočí, takže zvuky se dají doplňovat po jednom. Stačí soubor uložit pod přesně tímto
jménem (malými písmeny, bez diakritiky). Hlasitost a výšku si hra nastavuje sama, ale krátký zvuk bez
ticha na začátku zní nejlíp.

**Už jsou:** `krok-1…8` (tráva), `led-1…4` (zmrzlá hlína), `ovce-1`, `ovce-2`, `jehne`, `stado`
(smyčka), `strom-pada`, `triangl-1`, `triangl-2`.

Celkem chybí **47 zvuků**: 44 v příběhu a 3 ve vedlejších scénách. Některé zazní na víc místech, proto
jsou ve více tabulkách.

## Všude

| Soubor | Kdy zní |
|---|---|
| `odmena` | věc doletí do batohu (voda, semínka); strom v lese dá batoh |

## Louka

| Soubor | Kdy zní |
|---|---|
| `dvere` | panáček vejde do chalupy (otevřou se dveře) |
| `tetrivek-tokani` | klik na tetřívka na sloupu (tokání, bublavé „bu-bu-bu“) |

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
| `praskani` | souše praskne (zní i v kuchyni jako praskání ohně) |

## Kuchyně na Kantorské (semínka)

| Soubor | Kdy zní |
|---|---|
| `kasel` | babka, děda i panáček kašlou v kouři |
| `vrzani` | otevře se okno (viz les) |
| `tuk` | pohrabáč ťukne o tyč, kocour doskočí, fajfka cvakne o zem (krátké ťuknutí dřeva) |
| `dymka` | děda bafne z fajfky (u studánky panáček bafne, ve vyšší hlasitosti) |
| `predeni` | kocour přede |
| `sustot` | šustění roští (zní i u studánky při vytahování větviček a na vrcholu) |
| `praskani` | oheň se rozhoří (viz les) |
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

## Vrchol (zasazení sněžné květiny)

| Soubor | Kdy zní |
|---|---|
| `sustot` | zasazení semínek (viz kuchyně) |
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
| `ohen` | Nová Klínovka: oheň se rozhoří |

(Používají i `sustot` a `buch`, ty jsou už v seznamech výše.)
