# SpeedTicket Calculator

A comprehensive, data-driven speed ticket fine calculator that supports multiple countries and jurisdictions. The calculator determines fines, penalties, and consequences based on configurable rules, vehicle types, road types, and various factors.

## Features

- **Multi-Country Support**: Built-in support for Denmark (DK), United States (US), and United Kingdom (UK)
- **Realistic Speed Limits**: Accurate, research-based speed restrictions by vehicle type and road type
- **Dynamic Speed Limits**: Speed limits adjust automatically based on vehicle type, road type, and special conditions
- **Smart Factor Visibility**: Factors (like trailer options) only appear for relevant vehicle types
- **Rule-Based Logic**: Flexible rule engine for determining fines, penalties, and consequences
- **Real-Time Updates**: UI updates dynamically when vehicle type or conditions change
- **Legal Compliance**: Speed limits based on actual traffic laws for each country
- **Extensible Architecture**: Easy to add new countries, vehicle types, and road types

## Usage

### Basic Implementation

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

### Custom Data File

```html
<!-- Using a custom data file for another country -->
<speed-ticket data="data/data-canada.json"></speed-ticket>
```

### Programmatic API

```javascript
// Get reference to the calculator
const calculator = document.querySelector('speed-ticket');

// Set values programmatically
calculator.setSpeed(95);
calculator.setVehicle('truck');
calculator.setRoadType('highway');
calculator.toggleFactor('trailer', true);
```

## Data Structure

The calculator uses JSON configuration files to define country-specific rules and data. Each data file contains:

### Core Configuration

```json
{
  "locale": "da-DK",
  "currency": "DKK",
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
  }
}
```

### Road Types

Road types define available speed options and associated media:

```json
"roadTypes": {
  "cityZone": {
    "id": "cityZone",
    "label": "Byzone",
    "description": "Veje i byområder",
    "allowedSpeeds": [
      { "speed": 30, "label": "Byzone 30" },
      { "speed": 40, "label": "Byzone 40" },
      { "speed": 50, "label": "Byzone 50", "default": true }
    ],
    "video": "/assets/video/byzone.mp4"
  }
}
```

### Vehicle Types

Vehicle types define categories used in rule logic:

```json
"vehicles": {
  "car": {
    "id": "car",
    "label": "Personbil",
    "category": "car"
  },
  "truck": {
    "id": "truck",
    "label": "Lastbil",
    "category": "truck"
  }
}
```

### Factors

Factors are additional conditions that affect calculations. Each factor can specify which vehicle types it's visible for:

```json
"factors": {
  "trailer": {
    "id": "trailer",
    "label": "Anhænger",
    "description": "Køretøj med anhænger",
    "multiplier": 1.0,
    "visibleFor": ["car", "mc", "truck"]
  },
  "trailerTempo100": {
    "id": "trailerTempo100",
    "label": "Anhænger (tempo 100)",
    "description": "Køretøj med anhænger godkendt til 100 km/t",
    "multiplier": 1.0,
    "visibleFor": ["bus100"]
  }
}
```

#### Factor Visibility

The `visibleFor` property controls which vehicle types can see each factor:
- **Array of vehicle IDs or categories**: Factor only appears for specified vehicles
- **Omitted**: Factor appears for all vehicles (backward compatibility)

Examples:
- `"visibleFor": ["car", "mc"]`: Only cars and motorcycles
- `"visibleFor": ["bus100"]`: Only Bus Tempo 100
- `"visibleFor": ["truck", "commercial"]`: Commercial vehicles only

## Speed Limit Rules System

The calculator uses a priority-based rule system to determine allowed speeds:

### Rule Structure

```json
"speedLimitRules": [
  {
    "id": "any_vehicle_trailer",
    "description": "Any vehicle with trailer",
    "priority": 1,
    "conditions": [
      {
        "type": "or",
        "rules": [
          { "field": "factors", "operator": "includes", "value": "trailer" }
        ]
      }
    ],
    "limits": {
      "cityZone": [30, 40, 50, 60, 70],
      "countryRoad": [40, 50, 60, 70, 80],
      "highway": [50, 60, 70, 80],
      "default": {
        "cityZone": 50,
        "countryRoad": 80,
        "highway": 80
      }
    }
  }
]
```

### Priority System

Rules are evaluated by priority (lower numbers = higher priority):
- **Priority 1**: Trailer restrictions (highest priority)
- **Priority 2**: Vehicle-specific restrictions
- **Priority 10**: Default road type rules (lowest priority)

### Condition Types

- **Simple conditions**: Direct field comparisons
- **OR conditions**: Any rule must match
- **AND conditions**: All rules must match

### Supported Operators

- `=`: Equals
- `>=`, `<=`, `>`, `<`: Numeric comparisons
- `in`: Value in array
- `not_in`: Value not in array
- `includes`: Array contains value
- `not_includes`: Array does not contain value

### Available Fields

- `speed`: Current speed
- `speedLimit`: Current speed limit
- `percentageOver`: Percentage over speed limit
- `roadType`: Current road type
- `vehicle.category`: Vehicle category
- `factors`: Array of active factors

### New Limit Structure (Version 2.0+)

Modern speedLimitRules use the new format with realistic speed arrays:

```json
{
  "id": "school_bus_all",
  "description": "School buses - maximum 55 mph on highways, 60 mph on interstates",
  "priority": 2,
  "conditions": [
    { "field": "vehicle.category", "operator": "=", "value": "bus" }
  ],
  "limits": {
    "urban": [25, 30, 35, 40, 45],
    "suburban": [35, 40, 45],
    "rural": [45, 50, 55],
    "interstate": [55, 60],
    "default": {
      "urban": 35,
      "suburban": 40,
      "rural": 45,
      "interstate": 60
    }
  }
}
```

This structure:
- **Arrays per road type**: Lists all allowed speeds for each road type
- **Default speeds**: Specifies the default speed for each road type
- **Vehicle-specific**: Different vehicles get different speed options
- **Realistic limits**: Based on actual traffic laws

## Rule Engine

The rule engine determines fines and consequences based on configurable rules:

### Rate Selection Rules

Determine which rate category to use for fine calculation:

```json
"rateSelectionRules": [
  {
    "id": "rate3_vehicles",
    "description": "Bus, lastbil eller køretøj med anhænger",
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
```

### Penalty Rules

Add additional penalties based on conditions:

```json
"penaltyRules": [
  {
    "id": "extreme_speed",
    "description": "Ekstra bøde ved hastighed over 140 km/t",
    "conditions": [
      { "field": "speed", "operator": ">=", "value": 140 }
    ],
    "formula": {
      "type": "calculation",
      "expression": "Math.floor((speed - 140) / 10) * 600 + 1200"
    }
  }
]
```

### Consequence Rules

Determine legal consequences:

```json
"consequenceRules": [
  {
    "id": "license_points",
    "description": "Klip i kørekortet ved moderat fartoverskridelse",
    "conditions": [
      { "field": "percentageOver", "operator": ">", "value": 30 }
    ],
    "consequence": "LICENSE_POINTS"
  }
]
```

## Adding New Countries

To add support for a new country:

1. **Create Data File**: Copy an existing data file (e.g., `data-dk.json`) to `data-[country].json`

2. **Update Basic Configuration**:
   ```json
   {
     "locale": "en-CA",
     "currency": "CAD",
     "speedRange": { "unit": "km/h" }
   }
   ```

3. **Define Road Types**: Add country-specific road categories
4. **Define Vehicle Types**: Add local vehicle classifications
5. **Define Factors**: Add local conditions (school zones, construction, etc.)
6. **Configure Rules**: Set up speed limit rules, penalty rules, and consequence rules
7. **Update Penalty Ranges**: Define fine amounts and consequences

### Example: Adding Canada Support

```json
{
  "locale": "en-CA",
  "currency": "CAD",
  "roadTypes": {
    "residential": {
      "id": "residential",
      "label": "Residential Streets",
      "allowedSpeeds": [
        { "speed": 30, "label": "Residential 30 km/h" },
        { "speed": 40, "label": "Residential 40 km/h" },
        { "speed": 50, "label": "Residential 50 km/h", "default": true }
      ]
    }
  }
}
```

## Adding New Vehicle Types

To add a new vehicle type:

1. **Add to vehicles section**:
   ```json
   "vehicles": {
     "electricScooter": {
       "id": "electricScooter",
       "label": "Electric Scooter",
       "category": "scooter"
     }
   }
   ```

2. **Update speedLimitRules** to include the new category:
   ```json
   {
     "conditions": [
       { "field": "vehicle.category", "operator": "=", "value": "scooter" }
     ],
     "limits": {
       "cityZone": [15, 20, 25],
       "default": { "cityZone": 20 }
     }
   }
   ```

3. **Update rule engine** if the vehicle needs special treatment:
   ```json
   "rateSelectionRules": [
     {
       "conditions": [
         { "field": "vehicle.category", "operator": "=", "value": "scooter" }
       ],
       "result": "rateScooter"
     }
   ]
   ```

## Adding New Factors

To add a new factor with vehicle-specific visibility:

1. **Add to factors section**:
   ```json
   "factors": {
     "handicapPlate": {
       "id": "handicapPlate",
       "label": "Handicap License Plate",
       "description": "Vehicle with handicap registration",
       "multiplier": 0.5,
       "visibleFor": ["car", "van"]
     }
   }
   ```

2. **The factor automatically appears** only for specified vehicle types

3. **Update rules** if the factor affects calculations:
   ```json
   "penaltyRules": [
     {
       "conditions": [
         { "field": "factors", "operator": "includes", "value": "handicapPlate" }
       ],
       "penalty": -200
     }
   ]
   ```

## Adding New Road Types

To add a new road type:

1. **Add to roadTypes section**:
   ```json
   "roadTypes": {
     "schoolZone": {
       "id": "schoolZone",
       "label": "School Zone",
       "description": "Areas around schools",
       "allowedSpeeds": [
         { "speed": 15, "label": "School Zone 15" },
         { "speed": 20, "label": "School Zone 20", "default": true }
       ],
       "video": "/assets/video/school.mp4"
     }
   }
   ```

2. **Add speedLimitRules** for the new road type:
   ```json
   {
     "id": "school_zone_default",
     "description": "All vehicles in school zones",
     "conditions": [
       { "field": "roadType", "operator": "=", "value": "schoolZone" }
     ],
     "limits": {
       "schoolZone": [15, 20, 25],
       "default": { "schoolZone": 20 }
     }
   }
   ```

3. **Update existing rules** if they should apply to the new road type

## Adding New Rules

### Speed Limit Rules

```json
{
  "id": "emergency_vehicles",
  "description": "Emergency vehicles have higher limits",
  "priority": 1,
  "conditions": [
    { "field": "vehicle.category", "operator": "=", "value": "emergency" }
  ],
  "limits": {
    "cityZone": [50, 60, 70, 80],
    "highway": [80, 90, 100, 110, 130],
    "default": {
      "cityZone": 60,
      "highway": 100
    }
  }
}
```

### Penalty Rules

```json
{
  "id": "weekend_enhancement",
  "description": "Enhanced penalties on weekends",
  "conditions": [
    { "field": "factors", "operator": "includes", "value": "weekend" },
    { "field": "percentageOver", "operator": ">=", "value": 20 }
  ],
  "penalty": 500
}
```

### Consequence Rules

```json
{
  "id": "immediate_suspension",
  "description": "Immediate suspension for extreme speeds",
  "conditions": [
    { "field": "speed", "operator": ">=", "value": 200 }
  ],
  "consequence": "IMMEDIATE_SUSPENSION"
}
```

## API Reference

### Properties

- `data`: Path to the JSON data file
- `state`: Current calculator state (speed, roadType, vehicle, factors, selectedSpeedLimit)

### Methods

#### `setSpeed(value)`
Set the current speed.
```javascript
calculator.setSpeed(85);
```

#### `setRoadType(id)`
Set the road type.
```javascript
calculator.setRoadType('highway');
```

#### `setVehicle(id)`
Set the vehicle type.
```javascript
calculator.setVehicle('truck');
```

#### `toggleFactor(id, force)`
Toggle a factor on/off.
```javascript
calculator.toggleFactor('trailer', true);  // Add trailer
calculator.toggleFactor('trailer', false); // Remove trailer
calculator.toggleFactor('trailer');        // Toggle trailer
```

### Events

The calculator updates automatically when values change. Listen for custom events:

```javascript
calculator.addEventListener('state-change', (event) => {
  console.log('State changed:', event.detail);
});
```

## Data Validation

When creating new data files, ensure:

1. **Valid JSON**: Use a JSON validator
2. **Required Fields**: All required fields are present
3. **Consistent IDs**: IDs are unique and referenced correctly
4. **Logical Rules**: Rules don't conflict with each other
5. **Sensible Defaults**: Default values are reasonable

### Validation Script

```bash
python3 -c "import json; json.load(open('data/data-new.json'))"
```

## Examples

### Country-Specific Implementations

- **Denmark**: `data/data.json` - Metric system, DKK currency, Danish road types
- **United States**: `data/data-us.json` - Imperial system, USD currency, US road classifications
- **United Kingdom**: `data/data-uk.json` - Imperial system, GBP currency, UK road classifications

#### Realistic Speed Restrictions by Country

**🇺🇸 United States:**
- **School Buses**: Maximum 60 mph on interstates (not 85 mph)
- **Trucks**: Limited to 75 mph on interstates (varies by state)
- **Vehicles Towing**: Reduced speed limits across all road types
- **Commercial Vehicles**: Restricted speeds based on federal regulations

**🇬🇧 United Kingdom:**
- **HGVs (over 7.5t)**: Maximum 60 mph on motorways, 50 mph on single carriageways
- **Cars with Caravans**: Limited to 60 mph on motorways, 50 mph on single carriageways
- **Vans**: Different limits based on weight (car-derived vs commercial)
- **Buses**: Length-dependent restrictions (under/over 12 metres)

**🇩🇰 Denmark:**
- **Bus/Express Bus**: Restricted to 80 mph on country roads/expressways
- **Vehicles with Trailers**: Limited to 80 mph regardless of vehicle type
- **All Vehicles**: City zones allow 30-70 mph for all vehicle types

### Real-World Scenarios

```html
<!-- Multiple calculators on one page -->
<div class="calculator-grid">
  <div>
    <h3>Denmark</h3>
    <speed-ticket data="data/data.json"></speed-ticket>
  </div>
  <div>
    <h3>United States</h3>
    <speed-ticket data="data/data-us.json"></speed-ticket>
  </div>
  <div>
    <h3>United Kingdom</h3>
    <speed-ticket data="data/data-uk.json"></speed-ticket>
  </div>
</div>
```

## Performance Considerations

- **Data Loading**: Data is loaded once when the component initializes
- **Rule Evaluation**: Rules are evaluated on every state change
- **DOM Updates**: Only necessary elements are updated
- **Memory Usage**: Each instance maintains its own state

## Browser Compatibility

- **Modern Browsers**: Chrome 91+, Firefox 89+, Safari 14+, Edge 91+
- **Web Components**: Uses native Custom Elements
- **ES Modules**: Requires module support
- **CSS Custom Properties**: Used for theming

### Internal Methods (Advanced)

#### `getVisibleFactorsForCurrentVehicle()`
Returns factors that should be visible for the current vehicle type.
```javascript
const visibleFactors = calculator.getVisibleFactorsForCurrentVehicle();
```

#### `getAllowedSpeedsForCurrentConditions()`
Gets speed options for current vehicle/road/factor combination.
```javascript
const speeds = calculator.getAllowedSpeedsForCurrentConditions();
```

#### `updateFactorsPopover()`
Updates the factors UI and removes incompatible factors.
```javascript
calculator.updateFactorsPopover();
```

## Changelog

### Version 2.0 (Current)
- ✅ **Realistic Speed Limits**: All countries now use research-based, legally accurate speed restrictions
- ✅ **Smart Factor Visibility**: Factors only appear for relevant vehicle types
- ✅ **Enhanced US Rules**: School buses limited to 60 mph, trucks to 75 mph on interstates
- ✅ **Enhanced UK Rules**: HGVs limited to 60 mph on motorways, caravan restrictions
- ✅ **Improved Data Structure**: New speedLimitRules format with arrays and priorities
- ✅ **Dynamic UI Updates**: Real-time factor and speed option updates

### Version 1.0
- Basic multi-country support
- Rule-based calculation engine
- Simple speed limit structure

## Contributing

When adding new features:

1. **Test with Multiple Countries**: Ensure changes work with all data files
2. **Maintain Backward Compatibility**: Don't break existing data structures
3. **Document Changes**: Update this README for new features
4. **Validate Logic**: Ensure rules produce expected results
5. **Research Legal Requirements**: Use actual traffic laws for speed restrictions

## License

This component is part of the Browser Style library. Check the main project for licensing information.