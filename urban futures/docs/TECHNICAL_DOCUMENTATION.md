# Technical Documentation: NYC Climate Resilience Spatial Simulation

## Introduction: Empowering Communities Through Data-Driven Action

No matter how strong and accurate climate forecasting models are, meaningful change does not happen fast without government intervention, infrastructure adoption, or emergencies. Meaningful change ONLY happens when you put the power in the people.

This project embodies a fundamental shift from top-down policy making to grassroots empowerment: "Ask not what your country can do for you, but what you can do for your country." - JFK

The NYC Climate Resilience Spatial Simulation transforms complex climate data and environmental metrics into an accessible, interactive platform that enables every New Yorker to understand their neighborhood's climate vulnerability and take direct action. By combining cutting-edge machine learning, rea predictions, and community-driven engagement, the system democratizes climate science and empowers residents to advocate for their neighborhoods, collaborate with local organizations, and track the impact of green initiatives.

Rather than waiting for institutional responses to climate challenges, this platform equips individuals with the knowledge and tools to drive change from the ground up. Each tree planted, each community review submitted, and each green initiative shared represents collective action that compounds into measurable environmental impact.

## System Architecture Overview

The system follows a three-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  React/TypeScript Frontend with Mapbox GL JS               │
│  - Interactive map visualization                            │
│  - Real-time simulation controls                            │
│  - Community features (reviews, initiatives)                │
│  - Authentication and user profiles                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                    Application Layer                        │
│  Node.js/Express Backend (TypeScript)                      │
│  - REST API endpoints                                       │
│  - Business logic and data aggregation                      │
│  - Prediction orchestration                                 │
│  - Authentication middleware                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│ Data Layer   │ │ ML Models  │ │ Database   │
│ Parquet/JSON │ │ Python/C++ │ │ Supabase   │
│              │ │ Inference  │ │ PostgreSQL │
└──────────────┘ └────────────┘ └────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Mapbox GL JS for geospatial visualization
- Supabase client for authentication and database
- CSS modules for styling

**Backend:**
- Node.js 18+ with Express framework
- TypeScript for type safety
- Child process execution for Python model inference
- HTTP client integration with prediction servers

**Data Processing:**
- Python 3.8+ with pandas, geopandas, scikit-learn
- H3 hexagonal grid system for spatial indexing
- Parquet format for efficient data storage
- JSON for fast in-memory data access

**Database:**
- Supabase (PostgreSQL) for user data and community features
- Row Level Security (RLS) for data access control
- Storage buckets for image uploads

**Machine Learning:**
- Scikit-learn Random Forest for impact prediction
- Custom tree growth models (ML and rule-based)
- Optional C++ inference engine for production deployment

## Project Organization

The codebase is organized into clear modules:

```
urban futures/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components (Map, Sidebar, etc.)
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── lib/           # Utilities (Supabase client)
│   │   └── styles/        # CSS modules
│   └── package.json
│
├── backend/               # Node.js API server
│   ├── src/
│   │   ├── index.ts       # Express app and routes
│   │   └── services/      # Business logic services
│   │       ├── h3Service.ts          # H3 cell data management
│   │       ├── predictionService.ts  # Forward prediction logic
│   │       ├── simulationService.ts  # Impact simulation
│   │       └── congressionalService.ts # Representative data
│   └── package.json
│
├── python/                # Data pipeline and ML
│   ├── data_pipeline/
│   │   ├── prepare_zip_features.py  # Main data preparation
│   │   └── h3_utils.py              # Spatial utilities
│   └── model_training/
│       ├── train_model.py            # Impact model training
│       ├── train_growth_model.py     # Tree growth ML model
│       ├── prediction_server.py      # Fast inference server
│       └── [other training scripts]
│
├── cpp/                   # Optional C++ inference
│   ├── src/
│   │   ├── impact_model.cpp
│   │   └── main.cpp
│   └── CMakeLists.txt
│
├── data/                  # Datasets and models
│   ├── cache/             # Raw CSV files from NYC Open Data
│   ├── processed/         # Processed Parquet files
│   ├── external/          # Shapefiles, boundaries
│   └── models/            # Trained models and features
│
└── docs/                  # Documentation
    └── [various markdown files]
```

## How to Run the System

### Prerequisites

1. **Python 3.8+** with pip
2. **Node.js 18+** with npm
3. **Mapbox account** (free tier available) - Get access token at account.mapbox.com
4. **Supabase account** (free tier available) - For database and authentication
5. **C++ compiler** (optional) - Only needed for C++ inference engine

### Step 1: Install Dependencies

Run the automated setup script:

```bash
cd urban\ futures
./setup.sh
```

This script:
- Checks Python and Node.js installations
- Installs Python dependencies from `requirements.txt`
- Installs backend Node.js dependencies
- Installs frontend React dependencies
- Creates necessary directories
- Checks for Mapbox token configuration

Alternatively, install manually:

```bash
# Python dependencies
pip3 install -r requirements.txt

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2: Configure Environment Variables

**Frontend Configuration** (`frontend/.env`):

```env
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend Configuration** (`backend/.env` - optional):

```env
PORT=3001
PREDICTION_SERVER_URL=http://localhost:3002
AI_PREDICTION_SERVER_URL=http://localhost:3003
```

### Step 3: Prepare Data

Run the data preparation pipeline:

```bash
cd python/data_pipeline
python3 prepare_zip_features.py
```

This process:
1. Loads raw datasets from `data/cache/`
2. Processes street tree census data
3. Aggregates features to H3 hexagonal cells (resolution 9, ~1km² per cell)
4. Computes tree density, heat vulnerability, air quality scores
5. Calculates priority scores using weighted formula
6. Saves processed features to `data/models/h3_features.parquet` and `h3_features.json`
7. Generates GeoJSON boundaries for map visualization

**Expected duration:** 2-5 minutes depending on system resources

### Step 4: Train Models (Optional)

Train the machine learning models:

```bash
cd python/model_training
python3 train_model.py              # Impact prediction model
python3 train_growth_model.py       # Tree growth ML model
python3 load_baseline_temperature.py # Baseline temperature trends
```

**Note:** The impact prediction model uses synthetic training data based on literature priors. In production, you would train on actual historical impact measurements.

### Step 5: Start Prediction Server (Recommended)

Start the fast prediction server to enable real-time simulations:

```bash
./start_prediction_server.sh
# Or manually:
cd python/model_training
python3 prediction_server.py --port 3002
```

This server:
- Loads trained models into memory
- Responds to prediction requests in <50ms (vs 1-2 seconds for direct Python calls)
- Handles multiple concurrent requests
- Automatically falls back to direct Python calls if unavailable

### Step 6: Set Up Database

Follow the instructions in `docs/SUPABASE_SETUP.md`:

1. **Run migration**: Execute `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
2. **Create storage buckets**: `company-logos` and `green-initiative-images`
3. **Configure RLS policies**: Set up Row Level Security policies for data access
4. **Enable authentication**: Configure email provider in Supabase dashboard

### Step 7: Start Backend API

```bash
cd backend
npm run build  # Compile TypeScript
npm start      # Or npm run dev for auto-reload
```

Server starts on `http://localhost:3001`

### Step 8: Start Frontend

```bash
cd frontend
npm start
```

Frontend opens at `http://localhost:3000` with hot reload enabled.

### Verification

1. **Backend health check**: `curl http://localhost:3001/health`
2. **Test H3 endpoint**: `curl http://localhost:3001/h3/892a100002bffff`
3. **Frontend**: Map should load with NYC H3 cells colored by priority

## Model Architecture and Inputs

### Spatial Indexing: H3 Hexagonal Grid

The system uses H3 (developed by Uber) for spatial indexing instead of traditional ZIP codes or administrative boundaries. H3 provides:

- **Uniform cell size**: Resolution 9 yields ~1km² cells across all of NYC
- **Hierarchical structure**: Can aggregate to coarser resolutions or subdivide to finer ones
- **Efficient queries**: Fast point-in-cell and neighbor lookups
- **No boundary artifacts**: Avoids issues with irregular ZIP boundaries

Each H3 cell becomes a spatial unit for analysis, prediction, and visualization.

### Priority Score Calculation

Priority scores identify neighborhoods where tree planting will have the greatest impact. The calculation uses multiple weighted factors:

**Input Features:**
1. **Heat Vulnerability Index (HVI)**: Normalized 0-1 scale from NYC Department of Health
2. **Air Quality Score**: Combined PM2.5 and NO2 measurements from NYC Community Air Survey
3. **Tree Density**: Trees per km² from 2015 Street Tree Census
4. **Fuel Oil Usage**: Gallons per area as pollution proxy
5. **Environmental Justice Score**: Combined metric of:
   - Indoor environmental complaints (311 data)
   - Population density
   - Socioeconomic indicators

**Calculation Pseudocode:**

```
FUNCTION compute_priority_scores(features):
    // Normalize all features to 0-1 range
    heat_score = normalize(heat_vulnerability_index)
    air_score = normalize(air_quality_score)
    tree_density_norm = normalize(tree_density)
    tree_gap = 1 - tree_density_norm  // Inverse: low density = high gap
    pollution_proxy = normalize(fuel_oil_gallons)
    
    // Base priority (weighted combination)
    priority_base = 
        0.35 * heat_score +
        0.25 * air_score +
        0.25 * tree_gap +
        0.15 * pollution_proxy
    
    // Environmental justice multiplier (40% boost for EJ communities)
    priority_final = priority_base * (1 + 0.4 * ej_score)
    
    RETURN priority_final
```

This formula ensures:
- High heat vulnerability areas are prioritized
- Poor air quality neighborhoods receive attention
- Tree-poor areas get higher scores
- Environmental justice communities get weighted boost
- Maximum priority score = 1.4 (base of 1.0 with full EJ multiplier)

### Impact Prediction Model

The impact prediction model uses a Random Forest regressor to estimate "impact per dollar" - the primary optimization metric.

**Model Inputs (12 engineered features):**

1. **heat_score**: Normalized HVI
2. **air_quality_score**: Normalized combined air quality
3. **tree_density**: Trees per km²
4. **cooling_site_distance_norm**: Inverse normalized distance to cooling centers
5. **ej_score**: Environmental justice score (0-1)
6. **pollution_proxy**: Normalized fuel oil usage
7. **fuel_oil_log**: Log-transformed fuel oil (handles large values)
8. **heat_x_ej**: Interaction term (heat × EJ)
9. **air_x_ej**: Interaction term (air × EJ)
10. **heat_x_air**: Interaction term (heat × air)
11. **tree_gap_x_ej**: Interaction term ((1-density) × EJ)
12. **heat_air_combined**: Average of heat and air scores

**Feature Engineering:**

The model uses interaction terms to capture non-linear relationships. For example:
- `heat_x_ej` captures that high heat vulnerability in EJ communities has amplified impact
- `tree_gap_x_ej` ensures tree-poor EJ neighborhoods are prioritized

**Model Training:**

The model is trained on synthetic data derived from literature priors:
- ~2°F temperature reduction per tree (baseline)
- ~0.16 lbs PM2.5 removed per tree per year
- Cost per tree: $500-$2000 (varies by location and density)

**Training/Testing Split and Model Accuracy:**

All machine learning models in the system follow a consistent training methodology:

**Data Split:**
- **Training Set**: 80% of data (`test_size=0.2`)
- **Testing Set**: 20% of data
- **Random State**: 42 (ensures reproducibility)
- **Stratification**: Not used (regression task)

**Impact Prediction Model Performance:**

The primary Random Forest model for impact per dollar prediction achieves:
- **Training R² Score**: Typically 0.85-0.95 (varies by dataset size)
- **Testing R² Score**: Typically 0.75-0.85
- **Model Configuration**: 
  - 150 estimators (trees)
  - Maximum depth: 15
  - Features: 12 engineered features including interaction terms

**Tree Growth Model Performance:**

The ML-based tree growth predictor (trained on 2015 Street Tree Census data):
- **Training R² Score**: ~0.82-0.88
- **Testing R² Score**: ~0.75-0.82
- **Mean Absolute Error (MAE)**: ~0.3-0.5 cm/year growth rate
- **Model Configuration**:
  - 100 estimators
  - Maximum depth: 10
  - Minimum samples per split: 20

**Temperature Impact Model Performance:**

The temperature change prediction model:
- **Training R² Score**: ~0.80-0.87
- **Testing R² Score**: ~0.72-0.80
- **MAE**: ~0.01-0.02°F
- **RMSE**: ~0.02-0.03°F
- **Negative Predictions**: ~5-10% (captures scenarios where trees die or fail to establish)

**Model Validation Approach:**

1. **Train/Test Split**: Standard 80/20 split ensures models generalize to unseen data
2. **Cross-Validation**: Not used in production (single split for speed), but can be enabled for hyperparameter tuning
3. **Feature Importance**: Random Forest provides interpretable feature importance rankings
4. **Overfitting Detection**: Gap between train and test R² scores indicates generalization ability
5. **Synthetic Data Note**: Since models use synthetic training data based on literature priors, accuracy metrics reflect model fit to the synthetic distribution rather than real-world validation. In production with historical impact data, these metrics would represent true predictive accuracy.

**Prediction Pipeline:**

```
FUNCTION predict_impact_per_dollar(h3_features):
    // Load trained model, scaler, and feature names
    model = load_pickle("impact_model.pkl")
    scaler = load_pickle("scaler.pkl")
    feature_names = load_json("feature_names.json")
    
    // Apply same feature engineering as training
    engineered_features = feature_engineering(h3_features)
    
    // Scale features
    scaled_features = scaler.transform(engineered_features)
    
    // Predict
    impact_per_dollar = model.predict(scaled_features)
    
    RETURN impact_per_dollar
```

### Forward Prediction System

The forward prediction system projects environmental impact over time (5-30 years) accounting for:

1. **Tree Growth**: Trees grow over time, increasing their canopy area and impact
2. **Tree Mortality**: Some trees die, reducing effective count
3. **Climate Change**: Baseline temperature increases over time
4. **Size Scaling**: Impact scales with DBH² (canopy area increases quadratically)

**Tree Growth Model:**

Uses ML model trained on 2015 census data:

```
FUNCTION predict_tree_growth(dbh, species, health, years):
    IF ml_model_available:
        growth_rate = ml_model.predict(dbh, species, health)
    ELSE:
        growth_rate = rule_based_predictor(dbh, species, health)
    
    current_dbh = dbh
    FOR year IN 1..years:
        current_dbh += growth_rate
        // Apply survival probability
        IF random() > survival_rate(current_dbh, species, health):
            // Tree died
            BREAK
    
    RETURN current_dbh
```

**Temperature Reduction Calculation:**

```
FUNCTION calculate_temperature_reduction(tree_count, avg_dbh):
    // Base rate: 0.06°F per tree at 20cm DBH
    base_rate = 0.06
    
    // Size factor: canopy area scales with DBH²
    size_factor = (avg_dbh / 20.0)²
    
    // Annual temperature reduction
    temp_reduction = base_rate * size_factor * tree_count
    
    // Account for climate change (baseline warming)
    baseline_warming = warming_rate * years_ahead
    
    // Net change: cooling from trees minus warming baseline
    net_temp_change = -temp_reduction + baseline_warming
    
    RETURN net_temp_change
```

**CO2 Sequestration:**

```
FUNCTION calculate_co2_sequestration(tree_count, avg_dbh, years):
    // Average: 48 lbs CO2 per tree per year for mature trees
    base_rate_kg_per_year = 21.77  // Convert lbs to kg
    
    // Scale by tree size (DBH²)
    size_factor = (avg_dbh / 20.0)²
    
    // Annual sequestration
    annual_kg = base_rate_kg_per_year * size_factor * tree_count
    
    // Cumulative over years (accounting for growth)
    cumulative_kg = sum(annual_kg for each year, accounting for growth)
    
    RETURN cumulative_kg
```

**Yearly Projection Generation:**

```
FUNCTION generate_yearly_projections(base_tree_count, new_trees, years):
    projections = []
    current_tree_count = base_tree_count
    current_dbh = average_dbh_of_existing_trees
    
    FOR year IN 1..years:
        // Grow existing trees
        current_dbh = grow_trees(current_dbh, 1_year)
        
        // Add new trees (they start small and grow)
        IF new_trees > 0:
            new_trees_age = year
            new_trees_dbh = grow_from_seedling(new_trees_age)
            // Weighted average of old and new trees
            current_dbh = weighted_average(current_dbh, new_trees_dbh, counts)
        
        // Apply mortality
        current_tree_count = apply_mortality(current_tree_count, current_dbh)
        
        // Calculate impacts for this year
        temp_change = calculate_temperature_reduction(current_tree_count, current_dbh)
        co2_annual = calculate_co2_sequestration(current_tree_count, current_dbh, 1)
        
        projections.append({
            year: year,
            tree_count: current_tree_count,
            avg_dbh: current_dbh,
            temperature_reduction: temp_change,
            co2_sequestration: co2_annual
        })
    
    RETURN projections
```

## Full-Stack Implementation

### Frontend Architecture

**Component Hierarchy:**

```
App.tsx
├── LandingPage (initial screen)
├── AuthModal (authentication)
├── MapComponent (main map visualization)
│   ├── Mapbox GL map instance
│   ├── H3 layer (hexagonal cells)
│   ├── Thermal overlay (optional)
│   └── Tree point layer (optional)
├── Sidebar (neighborhood details and simulation)
│   ├── ReviewSection (community reviews)
│   ├── GreenInitiativesSection (user photos)
│   └── PredictionChart (future projections)
├── Information (about page)
└── Leaderboard (top contributors)
```

**State Management:**

- React hooks (`useState`, `useEffect`) for local component state
- Context API (`AuthContext`) for global authentication state
- Supabase client for real-time database subscriptions

**Map Rendering Flow:**

```
1. MapComponent mounts
2. Initializes Mapbox instance with access token
3. Waits for map style load event
4. Fetches H3 GeoJSON from backend API
5. Adds H3 cells as GeoJSON source
6. Creates fill layer with color expression based on priority_final
7. Adds click handlers for cell selection
8. Updates sidebar when cell clicked
```

**View Modes:**

The map supports two view modes:
- **Trees Mode**: Cells colored by priority score (green gradient)
- **Heat Index Mode**: Cells colored by thermal value (red gradient)

Color expressions use Mapbox interpolation for smooth gradients.

**Simulation Flow:**

```
1. User clicks H3 cell
2. Sidebar displays current neighborhood data
3. User adjusts sliders (trees to plant, years ahead)
4. Frontend debounces slider changes (300ms)
5. Sends prediction request to backend API
6. Backend orchestrates prediction calculation
7. Results displayed in sidebar with charts
```

### Backend Architecture

**Service Pattern:**

Each service class encapsulates related functionality:

**H3Service:**
- Loads H3 feature data from Parquet/JSON
- Caches features in memory for fast access
- Provides H3 cell lookup and aggregation
- Manages tree location data

**PredictionService:**
- Orchestrates forward prediction calculations
- Integrates with Python prediction server (if available)
- Falls back to direct Python subprocess calls
- Combines tree growth and impact models
- Generates yearly projections

**SimulationService:**
- Converts lat/lon to H3 cells
- Aggregates impact metrics
- Provides simulation results for arbitrary locations

**CongressionalService:**
- Loads ZIP code to representative mapping
- Enables users to find their elected officials
- Facilitates advocacy and outreach

**API Endpoints:**

```
GET /health
    → Health check endpoint

GET /h3/:cellId
    → Returns complete H3 cell data including features and predictions

GET /h3-cells
    → Returns all H3 cells with priority scores (for choropleth)

GET /h3-boundaries
    → Returns GeoJSON of all H3 cell boundaries

GET /predict?h3_cell=...&years=...&tree_count=...
    → Runs forward prediction for specified parameters

GET /simulate?lat=...&lon=...
    → Projects lat/lon to H3 cell and runs simulation

GET /congressional/:zipcode
    → Returns congressional representative data for ZIP code
```

**Request Flow Example:**

```
User clicks H3 cell
    ↓
Frontend: GET /h3/892a100002bffff
    ↓
Backend: H3Service.getH3Data()
    ↓
Backend: Load features from cache or JSON
    ↓
Backend: Predict impact using ML model
    ↓
Backend: Return JSON response
    ↓
Frontend: Display in Sidebar
```

**Prediction Server Integration:**

The backend attempts to use a persistent Python prediction server for speed:

```
1. Backend receives prediction request
2. Checks if prediction server is available (HTTP GET to port 3002)
3. IF available:
     → Send HTTP POST with prediction parameters
     → Receive response in <50ms
4. ELSE:
     → Spawn Python subprocess with prediction script
     → Wait for response (1-2 seconds)
5. Return results to frontend
```

### Data Flow

**Initial Data Preparation:**

```
NYC Open Data (CSV files)
    ↓
[Data Pipeline Script]
    ↓
Raw Processing:
  - Load shapefiles (ZIP boundaries)
  - Load tree census (683k trees)
  - Load environmental datasets
    ↓
Spatial Aggregation:
  - Convert lat/lon to H3 cells
  - Aggregate trees per cell
  - Interpolate air quality to cells
  - Calculate proximity features
    ↓
Feature Engineering:
  - Compute priority scores
  - Calculate EJ scores
  - Normalize all features
    ↓
Output:
  - h3_features.parquet (full data)
  - h3_features.json (fast access)
  - h3_features.geojson (map boundaries)
```

**Runtime Data Access:**

```
User Interaction
    ↓
Frontend: API Request
    ↓
Backend: Service Layer
    ↓
Data Access:
  IF cached in memory:
    → Return cached data
  ELSE:
    → Load from JSON (fast) or Parquet (slower)
    → Cache in memory
    → Return data
    ↓
Frontend: Update UI
```

**Database Operations:**

```
User Authentication
    ↓
Supabase Auth (JWT tokens)
    ↓
Frontend: Store token in localStorage
    ↓
API Requests: Include token in headers
    ↓
Supabase Client:
  → Automatic token injection
  → RLS policies enforce access control
    ↓
Database: user_profiles, reviews, green_initiatives
```

## Database Setup and Schema

### Supabase Configuration

**Project Setup:**
1. Create Supabase project at supabase.com
2. Note project URL and anon key
3. Add to frontend `.env` file

### Schema Overview

**user_profiles Table:**

Stores extended user information beyond Supabase auth.users:

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    user_type TEXT CHECK (user_type IN ('regular', 'corporate', 'guest')),
    company_domain TEXT,      -- For corporate users
    company_logo_url TEXT,    -- Corporate logo storage URL
    zipcode TEXT,             -- User's neighborhood
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**reviews Table:**

Community reviews for neighborhoods:

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    zipcode TEXT NOT NULL,
    h3_cell TEXT,             -- Optional H3 cell reference
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,
    lives_here BOOLEAN,       -- User lives in this area
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(user_id, zipcode)  -- One review per user per area
);
```

**green_initiatives Table:**

User-uploaded photos of green initiatives:

```sql
CREATE TABLE green_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    zipcode TEXT NOT NULL,
    h3_cell TEXT,
    image_url TEXT NOT NULL,  -- Supabase Storage URL
    caption TEXT,
    initiative_type TEXT CHECK (initiative_type IN 
        ('plant_flower', 'hang_vines', 'plant_tree', 'general')),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Read Access:**
- Public read access for all tables (community features are visible to everyone)

**Write Access:**
- Users can insert their own reviews and initiatives
- Users can update/delete only their own content
- Corporate users can upload company logos

**Implementation:**

RLS policies use Supabase's `auth.uid()` function to verify user identity:

```sql
CREATE POLICY "Users can insert own reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Storage Buckets

**company-logos Bucket:**
- Public read access
- Authenticated users can upload
- File size limit: 2MB
- MIME types: image/*

**green-initiative-images Bucket:**
- Public read access
- Authenticated users can upload/delete own images
- File size limit: 5MB
- MIME types: image/*

### Indexes

Performance indexes on frequently queried columns:

```
idx_reviews_zipcode          ON reviews(zipcode)
idx_reviews_h3_cell          ON reviews(h3_cell)
idx_green_initiatives_zipcode ON green_initiatives(zipcode)
idx_user_profiles_company_domain ON user_profiles(company_domain)
```

### Database Access from Frontend

The frontend uses Supabase client library:

```typescript
// Initialize client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication
const { data, error } = await supabase.auth.signInWithPassword({
    email, password
});

// Query reviews (RLS automatically enforced)
const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('zipcode', '10001');

// Upload image to storage
const { data: upload } = await supabase.storage
    .from('green-initiative-images')
    .upload(`user_${userId}/${filename}`, file);
```

## Advanced Features

### Thermal Overlay Visualization

The system can visualize heat distribution using:
- NVIDIA Earth-2 AI temperature predictions
- Thermal proxy calculation (tree gap + population density + building density)
- Heatmap rendering on Mapbox

**Thermal Proxy Calculation:**

```
FUNCTION calculate_thermal_proxy(tree_density, pop_density, building_density):
    // Inverse tree density: low trees = high heat
    tree_gap = 1 - normalize(tree_density)
    
    // Normalize population density (divide by 1000, max ~50k/km²)
    pop_norm = min(pop_density / 50, 1)
    
    // Normalize building density (0-1 range)
    building_norm = min(building_density, 1)
    
    // Weighted combination
    thermal_proxy = 
        0.6 * tree_gap +
        0.25 * pop_norm +
        0.15 * building_norm
    
    RETURN thermal_proxy
```

### Community Engagement Features

**Review System:**
- Users can leave star ratings and messages for neighborhoods
- Reviews filtered by ZIP code or H3 cell
- Displays "lives here" indicator for local residents
- Average ratings displayed on map

**Green Initiatives:**
- Users upload photos of tree planting, flower beds, etc.
- Captioned images shared publicly
- Filtered by initiative type (plant_tree, hang_vines, etc.)
- Encourages community participation and tracking

**Corporate Ambassadors:**
- Companies can create accounts with logos
- Corporate initiatives highlighted
- Enables corporate social responsibility tracking

### Prediction Server Architecture

The fast prediction server is a Python HTTP server that:

1. **Loads models at startup:**
   - ML tree growth predictor
   - Baseline temperature trends
   - Stays in memory for fast inference

2. **Handles concurrent requests:**
   - Thread-safe model access
   - Multiple prediction requests in parallel

3. **API Endpoints:**
   ```
   POST /predict
   Body: {
       "tree_count": 100,
       "avg_dbh": 10.0,
       "years": 15
   }
   Response: {
       "yearly_projections": [...],
       "summary": {...}
   }
   ```

4. **Performance:**
   - <50ms response time (vs 1-2 seconds for subprocess)
   - 100+ requests per second capacity
   - Automatic fallback if server unavailable

## Deployment Considerations

### Production Builds

**Frontend:**
```bash
cd frontend
npm run build
# Output: frontend/build/
# Serve with nginx, Vercel, Netlify, etc.
```

**Backend:**
```bash
cd backend
npm run build
# Output: backend/dist/
# Run with: node dist/index.js
# Or use PM2 for process management
```

### Environment Variables

Set production environment variables:
- `REACT_APP_API_URL`: Production backend URL
- `REACT_APP_MAPBOX_TOKEN`: Production Mapbox token
- `REACT_APP_SUPABASE_URL`: Production Supabase URL
- `PORT`: Backend server port (default: 3001)

### Data Updates

To update data with new NYC Open Data releases:

1. Download new CSV files to `data/cache/`
2. Run data preparation pipeline: `python3 prepare_zip_features.py`
3. Optionally retrain models: `python3 train_model.py`
4. Restart services to load new data

### Scaling Considerations

**Current Architecture:**
- Suitable for moderate traffic (<1000 concurrent users)
- In-memory caching works well for read-heavy workload
- Single prediction server handles ~100 req/sec

**Scaling Strategies:**
1. **Load Balancing**: Multiple backend instances behind nginx
2. **Prediction Server Pool**: Multiple Python servers with round-robin
3. **Redis Cache**: Move feature cache to Redis for distributed access
4. **CDN**: Serve GeoJSON and static assets via CDN
5. **Database Read Replicas**: Supabase handles this automatically

## Conclusion

The NYC Climate Resilience Spatial Simulation demonstrates how technology can bridge the gap between complex environmental science and community action. By providing accessible, actionable data through an intuitive interface, the system empowers residents to become agents of change in their neighborhoods.

The architecture balances performance, accuracy, and usability: machine learning models provide sophisticated predictions, while the H3 spatial indexing enables efficient data access and visualization. The community features foster engagement and collective action, turning data into a catalyst for grassroots environmental improvement.

As climate challenges intensify, tools like this become essential for democratizing climate action and enabling bottom-up solutions that complement top-down policy. The future of climate resilience depends not just on accurate models, but on engaged communities using those models to drive meaningful change.
