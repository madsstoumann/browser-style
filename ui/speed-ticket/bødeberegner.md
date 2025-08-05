# Fartbødeberegner: Oversigt og Regler

Dette dokument beskriver funktionaliteten af fartbødeberegneren (`speed-ticket` komponenten), der er implementeret i `index.js` og konfigureret via `data.json`.

## Overordnet Funktion

Beregneren er en web-komponent, der dynamisk udregner bødestørrelser og konsekvenser (klip, frakendelse) for fartoverskridelser baseret på en række input-parametre:

*   **Din hastighed**: Den målte hastighed.
*   **Vejtype**: Typen af vej, f.eks. byzone, landevej eller motorvej. Dette bestemmer hastighedsgrænsen.
*   **Køretøj**: Typen af køretøj, f.eks. personbil, lastbil eller bus.
*   **Faktorer**: Særlige omstændigheder, der kan påvirke bøden, f.eks. vejarbejde eller kørsel med anhænger.

## Regel-motor (`ruleEngine`)

Kernen i bødeberegneren er en regel-motor, der er defineret i `data.json` under `ruleEngine`. Motoren er ansvarlig for at bestemme bødens størrelse og eventuelle yderligere konsekvenser. Den er bygget op omkring et sæt af regler, der evalueres baseret på brugerens input.

Regel-motoren består af tre hoveddele:

1.  **`rateSelectionRules`**: Bestemmer, hvilken bødesats (`rate1`, `rate2`, eller `rate3`) der skal anvendes.
2.  **`penaltyRules`**: Tilføjer eventuelle ekstra bøder baseret på specifikke scenarier.
3.  **`consequenceRules`**: Evaluerer, om overtrædelsen medfører yderligere konsekvenser som "klip i kørekortet", "betinget frakendelse" eller "ubetinget frakendelse".

### Betingelser (`conditions`)

Hver regel i motoren har et sæt `conditions`, der skal være opfyldt, for at reglen aktiveres. En betingelse består af:

*   **`field`**: Det datafelt, der skal tjekkes (f.eks. `speed`, `roadType`, `percentageOver`).
*   **`operator`**: Den logiske operator, der skal bruges til sammenligning (f.eks. `=`, `>`, `<`, `includes`).
*   **`value`**: Den værdi, som `field` skal sammenlignes med.

Regler kan kombineres med `and` og `or` for at skabe mere komplekse logiske tjek.

### Forklaring af termer

*   **`value`**: I `data.json` bruges `value` ofte som en intern identifier for valgmuligheder i brugerfladen, f.eks. for vejtyper eller køretøjer. Den har ikke direkte indflydelse på selve beregningen, men bruges til at identificere det valgte element.
*   **`multiplier`**: Findes under `factors`. Dette er en multiplikator, der anvendes på den endelige bøde. For eksempel fordobler en `multiplier` på `2.0` (som ved vejarbejde) bødebeløbet. En `multiplier` på `1.0` har ingen effekt.
*   **`rate1`, `rate2`, `rate3`**: Disse er de grundlæggende bødesatser, der er defineret i `penaltyRanges`. Hvilken sats der vælges, afhænger af reglerne i `rateSelectionRules`. Typisk er `rate1` for lavere hastigheder/mindre køretøjer, `rate2` for højere hastigheder, og `rate3` for tungere køretøjer.
*   **`percentageOver`**: Angiver, hvor mange procent den målte hastighed er over den tilladte hastighedsgrænse. Dette er en central værdi, der bruges i mange regler til at bestemme både bødestørrelse og konsekvens.

## Beregningsflow

Beregningen af en fartbøde følger disse trin:

1.  **Find den procentvise overskridelse**: `percentageOver` beregnes.
2.  **Find grundbøden**: `penaltyRanges` gennemsøges for at finde det interval, som `percentageOver` falder indenfor.
3.  **Vælg bødesats**: `rateSelectionRules` evalueres for at bestemme, om `rate1`, `rate2` eller `rate3` skal bruges som grundbøde fra det fundne interval.
4.  **Anvend strafferegler**: `penaltyRules` tjekkes. Hvis betingelserne er opfyldt, lægges en ekstra straf til bøden. Dette kan være et fast beløb (`penalty`) eller en beregnet værdi baseret på en `formula`.
5.  **Anvend faktorer**: Den samlede bøde ganges med `multiplier` for hver aktiv faktor (f.eks. vejarbejde).
6.  **Evaluer konsekvenser**: `consequenceRules` gennemgås for at se, om overtrædelsen medfører yderligere konsekvenser. Den mest alvorlige konsekvens (f.eks. ubetinget frakendelse) har forrang.
7.  **Præsenter resultat**: Den endelige bøde og den alvorligste konsekvens vises for brugeren.

Dette system gør det muligt at have en fleksibel og datadrevet tilgang til bødeberegning, hvor regler og satser nemt kan justeres i `data.json` uden at skulle ændre i JavaScript-koden.
