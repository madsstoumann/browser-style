# Speed Ticket Calculator - Data-Driven Implementation

## Overview
The speed ticket calculator has been successfully converted to a 100% data-driven system using a rule engine architecture. This allows for easy configuration of different countries' traffic fine systems without code changes.

## Architecture

### Rule Engine Structure

The calculator now uses a rule engine defined in `data.json` under the `ruleEngine` section:

```json
{
  "ruleEngine": {
    "rateSelectionRules": [...],
    "penaltyRules": [...],
    "consequenceRules": [...]
  }
}
```

### 1. Rate Selection Rules
Determines which rate (rate1, rate2, rate3) to apply based on conditions:

- **rate1**: Default rate for cars/motorcycles under 100 km/h
- **rate2**: Higher rate for cars/motorcycles at 100+ km/h
- **rate3**: Highest rate for buses, trucks, or vehicles with trailers

### 2. Penalty Rules
Additional fines based on specific conditions:

- **High Speed in City/Country**: Extra 1200 DKK for >30% over limit
- **Extreme Speed**: Formula-based penalty for speeds >140 km/h

### 3. Consequence Rules
Determines special consequences like license suspension:

- **Unconditional License Loss**: Multiple conditions for automatic license revocation

## Key Features

### Data-Driven Components

1. **Vehicle Categories**: Configurable vehicle types with specific speed limits
2. **Road Types**: Different speed limits and rules per road type
3. **Factors**: Multipliers for special circumstances (roadwork, probationary license, etc.)
4. **Penalty Ranges**: Percentage-based fine calculations
5. **Rule Engine**: Complex conditional logic without hardcoded rules

### Rule Engine Operators

The system supports various conditional operators:
- `=`, `>=`, `<=`, `>`, `<`: Numeric comparisons
- `in`: Check if value is in array
- `includes`: Check if array contains value
- `not_includes`: Check if array doesn't contain value
- `and`: All conditions must be true
- `or`: At least one condition must be true

## Configuration for New Countries

To adapt the calculator for a different country:

### 1. Update Basic Configuration
```json
{
  "locale": "en-US",
  "currency": "USD",
  "speedRange": {
    "unit": "mph"
  }
}
```

### 2. Define Vehicle Types
```json
{
  "vehicles": {
    "car": {
      "id": "car",
      "label": "Car", 
      "category": "car"
    }
  }
}
```

### 3. Configure Road Types
```json
{
  "roadTypes": {
    "urban": {
      "id": "urban",
      "label": "Urban Area",
      "defaultSpeed": 35
    }
  }
}
```

### 4. Set Up Penalty Structure
```json
{
  "penaltyRanges": [
    {
      "percentageOver": 0,
      "rate1": 150,
      "rate2": 200,
      "rate3": 300,
      "description": "Minor speeding",
      "consequence": "Fine"
    }
  ]
}
```

### 5. Configure Rule Engine
Define country-specific rules for:
- Rate selection logic
- Additional penalties
- License suspension conditions

## Testing

The implementation includes comprehensive test cases:

1. **Bus Calculation**: Verifies the original bug fix (buses now calculate fines correctly)
2. **Rate Selection**: Tests all three rate categories
3. **Penalty Rules**: Tests additional penalties and formulas
4. **Consequence Rules**: Tests license suspension logic
5. **Factor Multipliers**: Tests special circumstances

## Benefits

1. **Maintainability**: No code changes needed for new rules
2. **Flexibility**: Easy to add new vehicle types, road types, or rules
3. **Internationalization**: Complete country customization through data
4. **Testing**: Rule changes can be tested without code deployment
5. **Transparency**: Business logic is visible in configuration

## Migration Notes

- All hardcoded logic has been moved to the rule engine
- The original API and UI remain unchanged
- Backward compatibility is maintained
- Performance impact is minimal due to efficient rule evaluation

## Files Modified

- `index.js`: Replaced hardcoded logic with rule engine evaluation
- `data.json`: Added comprehensive rule engine configuration
- Created test files for validation

The calculator is now truly data-driven and ready for international deployment!
