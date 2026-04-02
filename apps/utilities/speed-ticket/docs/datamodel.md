# Fartbødeberegner - Teknisk Dokumentation

Denne dokumentation forklarer hvordan den danske fartbødeberegner fungerer, baseret på JSON-strukturen i `data.json` og den tilhørende JavaScript-implementering.

## Overordnet System

Bødeberegneren simulerer det danske system for fartbøder og benytter en kompleks regelmotor til at beregne korrekte bøder baseret på:
- Hastighed og hastighedsgrænse
- Vejtype
- Køretøjstype
- Særlige faktorer (vejarbejde, anhænger, etc.)

## JSON-struktur Forklaring

### 1. Grundlæggende Konfiguration

```json
{
  "locale": "da-DK",
  "currency": "DKK",
  "speedRange": {
    "min": 0,
    "max": 200,
    "default": 50,
    "step": 1,
    "unit": "km/t"
  }
}
```

- **locale**: Sprog og region for formatering
- **currency**: Valuta for bødebeløb
- **speedRange**: Definerer hastighedsområdet for calculatoren

### 2. Vejtyper (`roadTypes`)

Systemet understøtter fire forskellige vejtyper:

| Vejtype | Standardhastighed | Beskrivelse |
|---------|------------------|-------------|
| `cityZone` | 50 km/t | Byzone |
| `countryRoad` | 80 km/t | Landevej |
| `expressway` | 90 km/t | Motortrafikvej |
| `highway` | 130 km/t | Motorvej |

### 3. Køretøjstyper (`vehicles`)

Fem forskellige køretøjskategorier:

- **Personbil** (`car`) - kategori: "car"
- **Motorcykel** (`motorcycle`) - kategori: "mc"
- **Lastbil** (`truck`) - kategori: "truck"
- **Bus** (`bus`) - kategori: "bus"
- **Bus Tempo 100** (`busExpress`) - kategori: "bus100"

### 4. Faktorer (`factors`)

Særlige omstændigheder der påvirker bøden:

| Faktor | Multiplikator | Beskrivelse |
|--------|---------------|-------------|
| `probationary` | 1.0 | Prøveperiode (under 3 år med kørekort) |
| `roadwork` | 2.0 | Vejarbejde - fordobler bøden |
| `alcoholImpairment` | 1.5 | Spirituskørsel |
| `trailer` | 1.0 | Anhænger |
| `trailerTempo100` | 1.0 | Anhænger godkendt til 100 km/t |

## Rate-system (rate1, rate2, rate3)

Det danske bødesystem opererer med tre forskellige takster afhængig af køretøj og hastighed:

### Rate 1 - Laveste takst
- **Anvendes til**: Personbiler og motorcykler uden anhænger
- **Betingelse**: Hastighedsgrænse under 100 km/t
- **Eksempel**: Kørsel i byzone (50 km/t) eller på landevej (80 km/t)

### Rate 2 - Mellem takst  
- **Anvendes til**: Personbiler og motorcykler uden anhænger
- **Betingelse**: Hastighedsgrænse 100 km/t eller højere
- **Eksempel**: Kørsel på motorvej (130 km/t)

### Rate 3 - Højeste takst
- **Anvendes til**: 
  - Busser og lastbiler
  - Alle køretøjer med anhænger
- **Begrundelse**: Tungere køretøjer udgør større risiko

## Bødeberegning - Trin for Trin

### 1. Beregning af Overskridelse
```javascript
const percentageOver = Math.round(((speed - speedLimit) / speedLimit) * 100);
```

### 2. Rate-udvælgelse
Systemet bruger `ruleEngine.rateSelectionRules` til at bestemme hvilken rate der skal anvendes:

```javascript
// Eksempel på rate-udvælgelse
if (køretøj er bus/lastbil ELLER har anhænger) {
    rate = "rate3"
} else if (hastighedsgrænse >= 100 km/t) {
    rate = "rate2"  
} else {
    rate = "rate1"
}
```

### 3. Grundbøde fra Penalty Ranges
Systemet finder det rette bødeområde baseret på procentvis overskridelse:

| Overskridelse | Rate1 | Rate2 | Rate3 | Beskrivelse |
|---------------|-------|-------|-------|-------------|
| 0-19% | 1.200 kr | 1.200 kr | 1.800 kr | Mindre fartoverskridelse |
| 20-29% | 1.800 kr | 1.800 kr | 1.800 kr | Moderat fartoverskridelse |
| 30-39% | 1.800 kr | 2.400 kr | 2.400 kr | Betydelig fartoverskridelse |
| 40-49% | 2.400 kr | 3.000 kr | 3.000 kr | Grov fartoverskridelse |
| 50-59% | 2.400 kr | 3.600 kr | 3.600 kr | Meget grov fartoverskridelse |
| 60-69% | 3.000 kr | 4.200 kr | 4.200 kr | Ekstrem fartoverskridelse |
| 70-79% | 3.600 kr | 5.400 kr | 5.400 kr | Meget ekstrem fartoverskridelse |
| 80-89% | 4.200 kr | 6.000 kr | 6.000 kr | Vanvittig fartoverskridelse |
| 90-99% | 5.400 kr | 7.800 kr | 7.800 kr | Livsfarlig fartoverskridelse |
| 100%+ | 6.000 kr | 9.000 kr | 9.000 kr | Ekstrem livsfarlig fartoverskridelse |

### 4. Tillægsbøder
Systemet anvender `penaltyRules` til at beregne ekstra bøder:

#### Høj hastighed i byzone/landevej
- **Betingelse**: ≥30% overskridelse i byzone eller på landevej (≤90 km/t)
- **Tillæg**: +1.200 kr

#### Ekstrem hastighed
- **Betingelse**: Hastighed ≥140 km/t
- **Formel**: `Math.floor((hastighed - 140) / 10) * 600 + 1200`
- **Eksempel**: Ved 150 km/t = `Math.floor((150-140)/10) * 600 + 1200 = 1800 kr ekstra`

### 5. Faktor-multiplikatorer
Til sidst ganges bøden med relevante faktormultiplikatorer:
- Vejarbejde: × 2.0
- Spirituskørsel: × 1.5

## Konsekvenser ud over Bøde

### Klip i Kørekortet
- **Betingelse**: >30% overskridelse
- **Resultat**: Administrativ sanktion

### Betinget Frakendelse
Udløses ved:
- >40% overskridelse ved vejarbejde
- >40% overskridelse for tunge køretøjer/anhænger
- ≥160 km/t eller >60% overskridelse for personbiler
- >60% overskridelse generelt

### Ubetinget Frakendelse
Udløses ved:
- ≥200 km/t
- ≥101% overskridelse + ≥101 km/t for forskellige køretøjstyper

## Implementering - Rule Engine

Systemet bruger en avanceret regelmotor med tre typer regler:

### 1. Rate Selection Rules
Bestemmer hvilken bødetakst der skal anvendes

### 2. Penalty Rules  
Beregner tillægsbøder baseret på specifikke betingelser

### 3. Consequence Rules
Bestemmer konsekvenser som frakendelse eller klip i kørekort

### Konditions-operatorer
- `=`: Lig med
- `>=`, `<=`, `>`, `<`: Sammenligning
- `in`: Værdi findes i array
- `includes`: Array indeholder værdi
- `not_includes`: Array indeholder ikke værdi

### Logiske operatorer
- `and`: Alle betingelser skal være opfyldt
- `or`: Mindst én betingelse skal være opfyldt

## Eksempel på Beregning

**Scenario**: Personbil kører 90 km/t i byzone (50 km/t) ved vejarbejde

1. **Overskridelse**: (90-50)/50 × 100 = 80%
2. **Rate-udvælgelse**: Rate1 (personbil, <100 km/t hastighedsgrænse)
3. **Grundbøde**: 4.200 kr (80% overskridelse, rate1)
4. **Tillægsbøde**: +1.200 kr (≥30% i byzone)
5. **Faktor**: ×2.0 (vejarbejde)
6. **Total**: (4.200 + 1.200) × 2.0 = **10.800 kr**
7. **Konsekvens**: Betinget frakendelse + klip i kørekort

## Særlige Regler

### Køretøjsspecifikke Hastighedsgrænser
- Lastbiler: Max 90 km/t
- Busser: Max 100 km/t

### Edge Cases
- Hastighed = 0: Ingen bøde
- Hastighed > 300: "For høj til at være realistisk"
- Hastighed ≤ hastighedsgrænse: Ingen bøde

Denne komplekse struktur sikrer at bødeberegneren præcist afspejler det danske system for fartbøder med alle dets nuancer og særregler.
