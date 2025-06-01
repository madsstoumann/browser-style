# Speed Ticket Calculator

A Danish speed ticket calculator web component that calculates fines based on speed violations, road types, vehicles, and aggravating factors.

## Overview

This calculator implements the Danish traffic fine system with support for:
- Multiple road types (city zones, country roads, expressways, highways)
- Different vehicle categories (cars, motorcycles, trucks, buses)
- Aggravating factors (roadwork, alcohol impairment, probationary license, trailers)
- Complex penalty calculations including special rules for extreme speeds

## Usage

```html
<speed-ticket data="./data.json"></speed-ticket>
<script src="index.js"></script>
```

## Data Model

The calculator uses a JSON-based data model (`data.json`) with the following structure:

### Core Configuration

```json
{
  "locale": "da-DK",
  "speedRange": {
    "min": 0,
    "max": 200,
    "default": 50,
    "step": 1,
    "unit": "km/t"
  }
}
```

### Road Types

Defines different road categories with their default speed limits:

```json
"roadTypes": {
  "cityZone": {
    "id": "cityZone",
    "label": "Byzone",
    "description": "Veje i byområder",
    "defaultSpeed": 50,
    "minSpeed": 30,
    "maxSpeed": 80,
    "value": 50
  }
  // ... other road types
}
```

### Vehicle Categories

Different vehicle types that affect fine calculations:

```json
"vehicles": {
  "car": {
    "id": "car",
    "label": "Personbil", 
    "value": 1,
    "category": "car"
  }
  // ... other vehicles
}
```

### Factors (Aggravating Circumstances)

Multipliers that increase the base fine:

```json
"factors": {
  "roadwork": {
    "id": "roadwork",
    "label": "Vejarbejde",
    "description": "Fartoverskridelse ved vejarbejde",
    "value": 2,
    "multiplier": 2.0
  },
  "alcoholImpairment": {
    "id": "alcoholImpairment", 
    "label": "Spirituskørsel",
    "description": "Fartoverskridelse kombineret med spirituskørsel",
    "value": 3,
    "multiplier": 1.5
  }
  // ... other factors
}
```

### Penalty Ranges

Progressive fine structure based on percentage over speed limit:

```json
"penaltyRanges": [
  {
    "percentageOver": 0,
    "rate1": 1200,
    "rate2": 1200,
    "rate3": 1800,
    "description": "Mindre fartoverskridelse",
    "consequence": "Bøde"
  },
  {
    "percentageOver": 30,
    "rate1": 1800,
    "rate2": 2400, 
    "rate3": 2400,
    "description": "Betydelig fartoverskridelse",
    "consequence": "Bøde + klip i kørekortet"
  }
  // ... progressive ranges up to 100%+
]
```

### Rate Categories

The system uses three rate categories:

- **Rate 1**: Cars/motorcycles under 100 km/h without trailer
- **Rate 2**: Cars/motorcycles at 100 km/h or higher  
- **Rate 3**: Buses, trucks, or vehicles with trailers

## Calculation Logic

### 1. Basic Fine Calculation

```javascript
// Calculate percentage over speed limit
const percentageOver = ((speed / speedLimit) * 100) - 100;

// Find applicable penalty range
const penaltyRange = penaltyRanges
  .reverse()
  .find(range => percentageOver >= range.percentageOver);

// Select rate based on vehicle and conditions
let baseFine = getBaseFine(penaltyRange, vehicle, speedLimit);
```

### 2. Special Rules Application

#### High-Speed City/Country Penalty
Additional 1200 kr fine for ≥30% over limit in city zones or country roads ≤90 km/h:

```javascript
if (percentageOver >= 30 && 
    (roadType === 'cityZone' || 
     (roadType === 'countryRoad' && speedLimit <= 90))) {
  baseFine += 1200;
}
```

#### Extreme Speed Penalty
Additional progressive fine for speeds ≥140 km/h:

```javascript
if (speed >= 140) {
  const extraFine = Math.floor((speed - 140) / 10) * 600 + 1200;
  baseFine += extraFine;
}
```

### 3. Factor Multipliers

Applied after base fine calculation:

```javascript
let finalFine = baseFine;
factors.forEach(factor => {
  if (factor.multiplier) {
    finalFine *= factor.multiplier;
  }
});
```

### 4. Special Conditions

#### Unconditional License Loss
Fine is calculated and returned along with immediate license revocation for:
- Speed ≥200 km/h
- Cars/motorcycles: ≥101% over + ≥101 km/h (without trailer) or ≥100% over + ≥101 km/h (with trailer)
- Buses/trucks: ≥101% over + ≥101 km/h

#### Vehicle-Specific Limits
- Trucks: Maximum 90 km/h
- Buses: Maximum 100 km/h
- Bus Tempo 100: Maximum 100 km/h

#### Return Values
The calculator returns only numeric currency values:
- **No violation**: `"0"`
- **Regular fine**: `"2.400"` (formatted with locale-specific thousands separator)
- **Extreme violation**: `"18.000"` (fine amount, consequence provided separately)

## Examples

### Example 1: Basic Violation
- **Speed**: 70 km/h
- **Speed Limit**: 50 km/h (city zone)
- **Vehicle**: Car
- **Factors**: None

**Calculation**:
- Percentage over: 40%
- Rate category: Rate 1 (car, <100 km/h, no trailer)
- Base fine: 2400 kr (40% range, rate1)
- High-speed penalty: +1200 kr (≥30% in city)
- **Total**: 3600 kr

### Example 2: With Roadwork
- **Speed**: 90 km/h  
- **Speed Limit**: 80 km/h
- **Vehicle**: Car
- **Factors**: Roadwork

**Calculation**:
- Percentage over: 12.5%
- Rate category: Rate 2 (car, ≥100 km/h)
- Base fine: 1200 kr (0-20% range, rate2)
- Roadwork multiplier: ×2
- **Total**: 2400 kr

### Example 3: Extreme Speed
- **Speed**: 155 km/h
- **Speed Limit**: 130 km/h  
- **Vehicle**: Car
- **Factors**: None

**Calculation**:
- Percentage over: 19.2%
- Rate category: Rate 2 (car, ≥100 km/h)
- Base fine: 1200 kr (0-20% range, rate2)
- Extreme speed penalty: Math.floor((155-140)/10) × 600 + 1200 = 1800 kr
- **Total**: 3000 kr

## File Structure

```
speed-ticket/
├── index.html          # Demo page
├── index.js            # Web component implementation
├── data.json           # Configuration and penalty data
└── readme.md           # This documentation
```

## Browser Support

- Modern browsers with ES6+ support
- Web Components (Custom Elements, Shadow DOM)
- CSS Custom Properties

## License

Part of the browser-style UI component library.