# Temperature Reduction Calculation Explanation

## How the Temperature Values are Calculated

### 1. **"Now: 2.69°F"** (Current State)
- **Source**: `prediction.current_state.temperature_reduction_f`
- **Calculation**: This is the **first year's** temperature reduction value
- **Code Location**: `predictionService.ts` line 200
- **Formula**: 
  ```typescript
  temperature_reduction_f: yearlyProjections[0]?.temperature_reduction_f || 0
  ```
- **What it represents**: The temperature reduction from trees in the current/starting year

### 2. **"In 15 years: 12.24°F"** (Final Year)
- **Source**: `prediction.yearly_projections[14].temperature_reduction_f` (last year)
- **Calculation**: This is the **last year's** temperature reduction value
- **Code Location**: `Sidebar.tsx` line 420
- **Formula**:
  ```typescript
  prediction.yearly_projections[prediction.yearly_projections.length - 1]?.temperature_reduction_f
  ```
- **What it represents**: The temperature reduction from trees after 15 years of growth

### 3. **"7.75°F Average over 15 years"** (Average)
- **Source**: `prediction.summary.avg_temperature_reduction_f`
- **Calculation**: Average of all yearly temperature reductions
- **Code Location**: `predictionService.ts` line 208
- **Formula**:
  ```typescript
  avg_temperature_reduction_f: cumulativeTemp / years
  ```
  Where `cumulativeTemp` is the sum of all yearly temperature values:
  ```typescript
  cumulativeTemp += yearPred.temp_annual;  // For each year
  ```
- **What it represents**: The average temperature reduction across all 15 years

## Detailed Calculation Flow

### Step 1: Calculate Yearly Temperature Reductions
For each year (1 to 15), the temperature reduction is calculated based on:
- **Tree count** (accounting for mortality)
- **Average DBH** (trees grow over time)
- **Size factor**: `(DBH / 20.0)²` (canopy area scales with DBH²)
- **Base rate**: 0.06°F per tree at 20cm DBH

**Formula per year**:
```typescript
tempAnnual = 0.06 * (currentDbh / 20.0)² * projectedTreeCount
```

### Step 2: Accumulate Values
```typescript
let cumulativeTemp = 0;
for (each year) {
  cumulativeTemp += tempAnnual;  // Sum all yearly values
}
```

### Step 3: Calculate Average
```typescript
avg_temperature_reduction_f = cumulativeTemp / years
// Example: (2.69 + 3.2 + 3.8 + ... + 12.24) / 15 = 7.75°F
```

## Why the Average is Higher than "Now"

The average (7.75°F) is higher than the starting value (2.69°F) because:
1. **Trees grow over time** - Larger trees provide more cooling
2. **New trees are planted** - Additional trees increase cooling capacity
3. **The average includes all years** - Later years have higher values, pulling the average up

## Example Calculation

If you have these yearly values:
- Year 1: 2.69°F
- Year 2: 3.20°F
- Year 3: 3.80°F
- ...
- Year 15: 12.24°F

**Average** = (2.69 + 3.20 + 3.80 + ... + 12.24) / 15 = **7.75°F**

This makes sense because:
- The starting value is 2.69°F
- The ending value is 12.24°F
- The average (7.75°F) is between them, weighted toward higher values in later years

## Code References

- **Backend Calculation**: `urban futures/backend/src/services/predictionService.ts` lines 120-135, 208
- **Frontend Display**: `urban futures/frontend/src/components/Sidebar.tsx` lines 410-421
- **Python Server**: `urban futures/python/model_training/prediction_server.py` lines 103-128
