# Forskelle mellem Gamle og Nye Bødeberegner

Efter at have analyseret den gamle bødeberegner (`TicketCalculator.init.js`) og den nye JSON-baserede version, har jeg identificeret følgende forskelle og ligheder:

## Hovedforskelle i Arkitektur

### Gamle Version (TicketCalculator.init.js)
- **Hardkodet logik**: Alle beregningsregler er indbygget i JavaScript-koden
- **UI-fokuseret**: Tæt integration mellem beregningslogik og brugerinterface
- **Swiper-baseret**: Bruger Swiper-biblioteket til navigation
- **Mindre struktureret**: Blandet beregnings- og UI-logik

### Nye Version (SpeedTicket Web Component)
- **Data-drevet**: Alle regler defineret i JSON-struktur
- **Modulær arkitektur**: Klar separation mellem data, logik og UI
- **Web Component**: Moderne standardbaseret implementering
- **Rule Engine**: Avanceret regelmotor for fleksibel konfiguration

## Beregningslogik Sammenligning

### ✅ IDENTISKE Beregninger

#### 1. Bødetakster (Rate System)
Begge versioner bruger samme tre-rate system:

**Gamle version (linje 773-798):**
```javascript
// rate1 - Under/= 100km og mc eller car og ingen trailer
// rate3 - Bus eller truck eller, mc eller car og trailer eller trailer-tempo100  
// rate2 - Over/= 100km og mc eller car
```

**Nye version (data.json):**
```json
"rateCategories": {
  "rate1": "Hastighed under 100 km/t, personbil/motorcykel uden anhænger",
  "rate2": "Hastighed 100 km/t eller over, personbil/motorcykel", 
  "rate3": "Bus, lastbil eller køretøj med anhænger"
}
```

#### 2. Bødebeløb Tabeller
Identiske beløb i begge versioner:

| Overskridelse | Rate1 | Rate2 | Rate3 |
|---------------|-------|-------|-------|
| 0-19% | 1.200 kr | 1.200 kr | 1.800 kr |
| 20-29% | 1.800 kr | 1.800 kr | 1.800 kr |
| 30-39% | 1.800 kr | 2.400 kr | 2.400 kr |
| 40-49% | 2.400 kr | 3.000 kr | 3.000 kr |
| 50-59% | 2.400 kr | 3.600 kr | 3.600 kr |
| 60-69% | 3.000 kr | 4.200 kr | 4.200 kr |
| 70-79% | 3.600 kr | 5.400 kr | 5.400 kr |
| 80-89% | 4.200 kr | 6.000 kr | 6.000 kr |
| 90-99% | 5.400 kr | 7.800 kr | 7.800 kr |
| 100%+ | 6.000 kr | 9.000 kr | 9.000 kr |

#### 3. Tillægsbøder

**Høj hastighed i byzone/landevej (≥30% overskridelse):**
- Gamle: `fine += this.ticketProcentageArray[0].rate1;` (+1.200 kr)
- Nye: `"penalty": 1200` (+1.200 kr)

**Ekstrem hastighed (≥140 km/t):**
- Gamle: `Math.floor((this.inputObj.speed - 140) / 10) * (this.ticketProcentageArray[0].rate1 / 2) + this.ticketProcentageArray[0].rate1`
- Nye: `Math.floor((speed - 140) / 10) * 600 + 1200`

#### 4. Vejarbejde Multiplikator
- Begge versioner: × 2.0 (fordobling af bøde)

#### 5. Ubetinget Frakendelse Regler
Identiske betingelser i begge versioner:
- ≥200 km/t
- Personbil/MC uden anhænger: ≥101% overskridelse + ≥101 km/t
- Personbil/MC med anhænger: ≥100% overskridelse + ≥101 km/t  
- Bus/lastbil: ≥101% overskridelse + ≥101 km/t

## ⚠️ MINDRE FORSKELLE

### 1. Vejtyper Organisering

**Gamle version:** 3 kategorier
```javascript
this.roadTypes = {
  city: { text: "Byvej", def: 50, max: 80, min: 30 },
  country: { text: "Land- /Motortrafikvej", def: 80, max: 90, min: 40 },
  highway: { text: "Motorvej", def: 130, max: 130, min: 40 }
};
```

**Nye version:** 4 kategorier
```json
"roadTypes": {
  "cityZone": { "defaultSpeed": 50 },
  "countryRoad": { "defaultSpeed": 80 },
  "expressway": { "defaultSpeed": 90 },  // ← NY kategori
  "highway": { "defaultSpeed": 130 }
}
```

### 2. Køretøjsspecifikke Hastighedsgrænser

**Gamle version:** Hardkodet kontrol
```javascript
if (this.inputObj.vehicle === "truck" && this.inputObj.speed > 90) {
  displayTexts.push("truck");
} else if (this.inputObj.vehicle === "bus" && this.inputObj.speed > 100) {
  displayTexts.push("bus");
}
```

**Nye version:** Konfigureret i JSON
```json
"vehicleSpecificLimits": {
  "truck": { "maxSpeed": 90, "message": "Lastbiler må maksimalt køre 90 km/t" },
  "bus": { "maxSpeed": 100, "message": "Busser må maksimalt køre 100 km/t" }
}
```

### 3. Faktor System

**Gamle version:** Kun vejarbejde implementeret
- Vejarbejde: × 2.0

**Nye version:** Omfattende faktor system
```json
"factors": {
  "probationary": { "multiplier": 1.0 },
  "roadwork": { "multiplier": 2.0 },
  "alcoholImpairment": { "multiplier": 1.5 },  // ← NY
  "trailer": { "multiplier": 1.0 },
  "trailerTempo100": { "multiplier": 1.0 }
}
```

## 🔧 TEKNISKE FORBEDRINGER

### 1. Rule Engine
**Nye version** introducerer en kraftfuld regelmotor med:
- Konditionelle regler (`and`, `or` operatorer)
- Fleksible sammenligningsoperatorer (`>=`, `in`, `includes`, etc.)
- Separate regel-kategorier (rate-udvælgelse, bøder, konsekvenser)

### 2. Bedre Struktur
**Nye version** har:
- Klar separation af data og logik
- Nemmere vedligeholdelse og opdatering
- Bedre testbarhed
- Internationalisering support

### 3. Udvidelsesmuligheder
**Nye version** understøtter:
- Multiple datakilder (data.json, data-us.json)
- Nemt tilføjelse af nye faktorer
- Fleksible besked-systemer
- Forskellige lokalisering/valuta

## 📊 KONKLUSION

### Matematisk Nøjagtighed: ✅ IDENTISK
Kerneberegningerne er matematisk identiske mellem de to versioner. Begge producerer samme bødebeløb for samme input.

### Funktionalitet: 🔄 UDVIDET
Den nye version udvider funktionaliteten betydeligt med:
- Flere faktorer (spirituskørsel, prøveperiode)
- Bedre håndtering af særlige køretøjer
- Mere detaljerede vejtyper
- Avanceret regelmotor

### Vedligeholdelse: 📈 FORBEDRET  
Den nye arkitektur er markant lettere at vedligeholde og udvide uden kodeændringer.

**Samlet vurdering:** Den nye version er en komplet og forbedret efterfølger til den gamle, med identisk kerneberegning men betydeligt udvidet funktionalitet og vedligeholdelsesevne.
