# SpeedTicket Calculator

A comprehensive, data-driven speed ticket fine calculator that supports multiple countries and jurisdictions. The calculator determines fines, penalties, and consequences based on configurable rules, vehicle types, road types, and various factors.

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Speed Ticket Calculator</title>
</head>
<body>
    <!-- Danish calculator (default) -->
    <speed-ticket data="data/data.json"></speed-ticket>

    <!-- US calculator -->
    <speed-ticket data="data/data-us.json"></speed-ticket>

    <!-- UK calculator -->
    <speed-ticket data="data/data-uk.json"></speed-ticket>

    <script type="module" src="index.js"></script>
</body>
</html>
```

## How to Create a Data Configuration

All calculator behavior is defined in JSON configuration files. Each file represents a complete jurisdiction with its own rules, vehicles, road types, and penalties.

### Basic Configuration Structure

```json
{
  "locale": "da-DK",
  "currency": "DKK",
  "thresholds": {
    "dangerPercentageOver": 30
  },
  "speedRange": {
    "min": 0,
    "max": 200,
    "default": 80,
    "unit": "km/t"
  },
  "defaults": {
    "roadType": "countryRoad",
    "vehicle": "car",
    "factors": []
  },
  "circularRange": {
    "start": "220",
    "end": "500",
    "indices": "50",
    "labels": "0:0,30:30,40:40,50:50,60:60,70:70,80:80,90:90,100:100,110:110,130:130,200:200"
  }
}
```

## How to Create Road Types

Road types define the available driving environments and their speed options.

```json
"roadTypes": {
  "cityZone": {
    "id": "cityZone",
    "label": "City Zone",
    "description": "Urban areas with reduced speeds",
    "allowedSpeeds": [
      { "speed": 30, "label": "City Zone 30" },
      { "speed": 40, "label": "City Zone 40" },
      { "speed": 50, "label": "City Zone 50", "default": true }
    ],
    "video": "/assets/video/city.mp4",
    "poster": "/assets/images/city-poster.jpg"
  }
}
```

**Required fields:**
- `id`: Unique identifier for the road type
- `label`: Display name shown to users
- `allowedSpeeds`: Array of speed options with labels
- `video`: Path to background video file

**Optional fields:**
- `description`: Detailed description
- `poster`: Poster image for video
- `default: true` on one speed option to set the default selection

## How to Create Vehicle Types

Vehicle types define different categories of vehicles with their own rules.

```json
"vehicles": {
  "car": {
    "id": "car",
    "label": "Car",
    "category": "car"
  },
  "truck": {
    "id": "truck",
    "label": "Truck",
    "category": "commercial"
  },
  "motorcycle": {
    "id": "motorcycle",
    "label": "Motorcycle",
    "category": "mc"
  }
}
```

**Required fields:**
- `id`: Unique identifier
- `label`: Display name
- `category`: Category used in rule matching (can be same as id or a broader category)

**Category examples:** `car`, `truck`, `bus`, `mc` (motorcycle), `commercial`, etc.

## How to Create Factors

Factors are additional conditions that modify speed limits, penalties, or visibility.

```json
"factors": {
  "trailer": {
    "id": "trailer",
    "label": "With Trailer",
    "description": "Vehicle towing a trailer",
    "multiplier": 1.0,
    "visibleFor": ["car", "truck"]
  },
  "roadwork": {
    "id": "roadwork",
    "label": "Construction Zone",
    "description": "Active roadwork area",
    "multiplier": 2.0,
    "visibleFor": ["car", "mc", "truck", "bus"]
  }
}
```

**Required fields:**
- `id`: Unique identifier
- `label`: Display name
- `multiplier`: Multiplies the final fine (1.0 = no change, 2.0 = double)

**Optional fields:**
- `description`: Detailed explanation
- `visibleFor`: Array of vehicle IDs or categories that can see this factor. If omitted, visible to all vehicles

## How to Create Speed Limit Rules

Speed limit rules dynamically determine which speeds are available based on vehicle type, road type, and active factors.

```json
"speedLimitRules": [
  {
    "id": "trailer_restrictions",
    "description": "Vehicles with trailers have reduced speed limits",
    "priority": 1,
    "conditions": [
      {
        "field": "factors",
        "operator": "includes",
        "value": "trailer"
      }
    ],
    "limits": {
      "cityZone": [30, 40, 50],
      "highway": [80, 90, 100],
      "default": {
        "cityZone": 50,
        "highway": 80
      }
    }
  }
]
```

**Required fields:**
- `id`: Unique identifier
- `conditions`: Array of condition objects that determine when this rule applies
- `limits`: Object defining available speeds per road type

**Priority system:** Lower numbers = higher priority. Rules are evaluated in priority order, first match wins.

**Limits structure:**
- Keys match road type IDs
- Values are arrays of allowed speeds
- `default` object specifies the default speed for each road type

## How to Create Rule Conditions

Conditions determine when rules apply. They support simple conditions, OR logic, and AND logic.

### Simple Conditions

```json
{ "field": "speed", "operator": ">=", "value": 100 }
{ "field": "vehicle.category", "operator": "=", "value": "truck" }
{ "field": "factors", "operator": "includes", "value": "trailer" }
```

### OR Conditions

```json
{
  "type": "or",
  "rules": [
    { "field": "vehicle.category", "operator": "=", "value": "bus" },
    { "field": "vehicle.category", "operator": "=", "value": "truck" }
  ]
}
```

### AND Conditions

```json
{
  "type": "and",
  "rules": [
    { "field": "speed", "operator": ">=", "value": 140 },
    { "field": "roadType", "operator": "=", "value": "highway" }
  ]
}
```

### Available Fields

- `speed`: Current speed
- `speedLimit`: Current speed limit
- `percentageOver`: Percentage over speed limit
- `roadType`: Current road type ID
- `vehicle.category`: Vehicle category
- `factors`: Array of active factor IDs

### Available Operators

- `=`: Equals
- `>=`, `<=`, `>`, `<`: Numeric comparisons
- `in`: Value exists in array
- `not_in`: Value does not exist in array
- `includes`: Array contains value
- `not_includes`: Array does not contain value

## How to Create Penalty Ranges

Penalty ranges define base fine amounts based on how much the speed limit is exceeded.

```json
"penaltyRanges": [
  {
    "percentageOver": 0,
    "rate1": 1200,
    "rate2": 1200,
    "rate3": 1800,
    "description": "Minor speed violation",
    "consequence": "Fine only",
    "summary": "Minor violation"
  },
  {
    "percentageOver": 30,
    "rate1": 1800,
    "rate2": 2400,
    "rate3": 2400,
    "description": "Significant speed violation",
    "consequence": "Fine + license points",
    "summary": "Significant violation"
  }
]
```

**Required fields:**
- `percentageOver`: Minimum percentage over speed limit for this range
- `rate1`, `rate2`, `rate3`: Fine amounts for different vehicle categories
- `description`: Description of the violation
- `consequence`: Legal consequences
- `summary`: Short summary for status display

**Rate selection:** The system uses rate selection rules to determine which rate column applies to each vehicle/factor combination.

## How to Create Rule Engine

The rule engine contains three types of rules that determine fines and consequences.

### Rate Selection Rules

Determine which rate column (rate1, rate2, rate3) to use from penalty ranges.

```json
"ruleEngine": {
  "rateSelectionRules": [
    {
      "id": "commercial_vehicles",
      "description": "Commercial vehicles use rate3",
      "conditions": [
        {
          "type": "or",
          "rules": [
            { "field": "vehicle.category", "operator": "in", "value": ["bus", "truck"] },
            { "field": "factors", "operator": "includes", "value": "trailer" }
          ]
        }
      ],
      "result": "rate3"
    }
  ]
}
```

### Penalty Rules

Add extra penalties on top of the base fine.

```json
"penaltyRules": [
  {
    "id": "extreme_speed",
    "description": "Extra penalty for extreme speeds",
    "conditions": [
      { "field": "speed", "operator": ">=", "value": 140 }
    ],
    "formulaId": "extremeSpeedPenalty"
  },
  {
    "id": "construction_zone",
    "description": "Fixed penalty in construction zones",
    "conditions": [
      { "field": "factors", "operator": "includes", "value": "roadwork" },
      { "field": "percentageOver", "operator": ">=", "value": 20 }
    ],
    "penalty": 1200
  }
]
```

**Penalty options:**
- `penalty`: Fixed amount to add
- `formulaId`: Reference to a formula for complex calculations

### Consequence Rules

Determine legal consequences beyond fines.

```json
"consequenceRules": [
  {
    "id": "license_suspension",
    "description": "License suspension for extreme violations",
    "conditions": [
      { "field": "percentageOver", "operator": ">=", "value": 100 }
    ],
    "consequence": "LICENSE_SUSPENSION"
  }
]
```

## How to Create Formulas

Formulas enable complex penalty calculations for specific scenarios.

```json
"formulas": {
  "extremeSpeedPenalty": {
    "id": "extremeSpeedPenalty",
    "type": "escalatingPenalty",
    "description": "Escalating penalty for extreme speeds",
    "baseSpeed": 140,
    "increment": 10,
    "multiplier": 600,
    "base": 1200
  }
}
```

### Formula Types

#### Escalating Penalty

Penalties that increase in steps as speed increases.

```json
{
  "type": "escalatingPenalty",
  "baseSpeed": 140,    // Speed where penalty starts
  "increment": 10,     // Speed increment for each step
  "multiplier": 600,   // Amount added per step
  "base": 1200        // Base penalty amount
}
```

**Formula:** `Math.floor((speed - baseSpeed) / increment) * multiplier + base`

**Example:** Speed 165, base 140, increment 10, multiplier 600, base 1200
- Steps over base: `Math.floor((165 - 140) / 10) = 2`
- Total penalty: `2 * 600 + 1200 = 2400`

#### Fixed Amount

Simple fixed penalty.

```json
{
  "type": "fixedAmount",
  "amount": 500
}
```

#### Percentage

Percentage of current speed.

```json
{
  "type": "percentage",
  "percentage": 10
}
```

**Formula:** `speed * percentage / 100`

## How to Create Messages and Labels

Define user-facing text for different scenarios.

```json
"labels": {
  "yourSpeed": "Your Speed",
  "speedLimit": "Speed Limit",
  "factors": "Additional Factors"
},
"messages": {
  "noFine": "No fine - you're within the speed limit",
  "defaultViolation": "Speed limit violation"
}
```

## How to Create Consequence Types

Define the severity and behavior of different legal consequences.

```json
"consequenceTypes": {
  "LICENSE_POINTS": {
    "id": "LICENSE_POINTS",
    "label": "License Points",
    "severity": 1,
    "preventsFine": false
  },
  "LICENSE_SUSPENSION": {
    "id": "LICENSE_SUSPENSION",
    "label": "License Suspension",
    "severity": 5,
    "preventsFine": true
  }
}
```

**Fields:**
- `severity`: Higher numbers = more severe (used for ranking when multiple consequences apply)
- `preventsFine`: If true, no monetary fine is calculated (consequence replaces fine)

## Programmatic API

### Setting Values

```javascript
const calculator = document.querySelector('speed-ticket');

// Set speed
calculator.setSpeed(95);

// Change vehicle type
calculator.setVehicle('truck');

// Change road type
calculator.setRoadType('highway');

// Add/remove factors
calculator.toggleFactor('trailer', true);  // Add trailer
calculator.toggleFactor('trailer', false); // Remove trailer
calculator.toggleFactor('trailer');        // Toggle trailer
```

### Reading State

```javascript
// Current state
console.log(calculator.state);
// { speed: 95, roadType: 'highway', vehicle: 'truck', factors: Set(['trailer']), selectedSpeedLimit: 80 }

// Get calculated results
const results = calculator.calculateResults();
console.log(results);
// { description: "...", fine: "€1,800", summary: "Moderate violation", status: "warning" }
```

### Events

```javascript
calculator.addEventListener('state-change', (event) => {
  console.log('Calculator state changed:', event.detail);
});
```

## Testing Your Configuration

1. **JSON Validation:** Ensure your JSON is valid
   ```bash
   python3 -c "import json; json.load(open('data/data-new.json'))"
   ```

2. **Test Basic Scenarios:**
   - Speed at limit (should show no fine)
   - Speed 20% over limit (should show warning)
   - Speed 50% over limit (should show danger)

3. **Test Vehicle-Specific Rules:**
   - Different vehicles should show different available factors
   - Different vehicles should have different speed limits
   - Different vehicles should use different rate columns

4. **Test Factor Interactions:**
   - Adding factors should change available speeds
   - Factors should multiply final fines correctly
   - Factors should only appear for appropriate vehicles

## Performance Considerations

- **Data Loading:** Configuration is loaded once on initialization
- **Rule Evaluation:** Rules are sorted by priority and evaluated efficiently
- **DOM Updates:** Only necessary elements are updated when state changes
- **Memory Usage:** Each calculator instance maintains independent state

## Browser Support

- **Modern Browsers:** Chrome 91+, Firefox 89+, Safari 14+, Edge 91+
- **Web Components:** Uses native Custom Elements API
- **ES Modules:** Requires native module support
- **CSS Custom Properties:** Uses CSS variables for theming