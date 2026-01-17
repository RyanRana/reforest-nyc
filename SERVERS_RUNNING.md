# 🚀 NYC Urban Futures - Servers Running

## ✅ Status: ALL SYSTEMS OPERATIONAL

### Backend API Server
- **Status:** ✅ Running
- **URL:** http://localhost:3001
- **Terminal:** 6.txt
- **Port:** 3001
- **Data Loaded:**
  - 6,218 H3 cells
  - 1,794 ZIP codes  
  - 99 congressional data entries

### Frontend Dashboard
- **Status:** ✅ Running (compiled with warnings)
- **URL:** http://localhost:3000 (default React port)
- **Terminal:** 5.txt
- **Port:** 3000
- **Framework:** React with TypeScript
- **Build Status:** Webpack compiled with 1 warning (non-critical ESLint warnings)

### Tree Planting Coordinate Generation
- **Status:** ✅ Completed
- **Output File:** `/Users/ryanrana/Downloads/nycleap/urban futures/data/processed/available_tree_planting_coordinates.json`
- **Total Valid Locations:** 35,248 tree planting sites
- **File Size:** 3.0 MB
- **Validation Rate:** 1.5% (35,248 valid out of 2,349,872 candidates)

### NYC Compliance Data Cleaning
- **Status:** ✅ Completed
- **Files Cleaned:** 6 datasets
- **Total Size Reduction:** 3.6 GB → 957 MB (73% reduction)
- **Output Directory:** `/Users/ryanrana/Downloads/nycleap/Compliance data merged/`
- **Cleaned Files:**
  - Bus_Stop_Shelter_coordinates_only.csv (3,381 locations)
  - Hydrants_coordinates_only.csv (109,725 locations)
  - Parking_Regulation_coordinates_only.csv (404,262 locations)
  - BUILDING_coordinates_only.csv (1,082,968 buildings)
  - NYC_Planimetric_Sidewalk_coordinates_only.csv (50,865 sidewalks)
  - Street_Sign_Work_Orders_coordinates_only.csv (7,246,714 signs)

## 🌐 Access Your Application

1. **Open your browser** and navigate to:
   - **Frontend Dashboard:** http://localhost:3000
   - **Backend API:** http://localhost:3001

2. **Available API Endpoints:**
   - GET `/api/h3-data` - H3 hexagon data
   - POST `/api/predict` - Temperature predictions
   - POST `/api/tree-impact` - Tree planting impact analysis
   - GET `/api/zip-codes` - ZIP code data

## 📊 Rules Applied for Tree Planting

The tree planting coordinate generator used official NYC regulations:
- **Tree Spacing:** 30 ft apart
- **Tree Diameter:** 10.67 inches
- **Stop Sign Clearance:** 30 ft
- **Street Sign Clearance:** 6 ft
- **Fire Hydrant Clearance:** 5 ft
- **Intersection Clearance:** 40 ft
- **Building Clearance:** 5 ft minimum
- **Sidewalk Requirement:** Points must be within sidewalk polygons
- **Bus Stop Rule:** No trees at curb (setback required)

## 🛑 To Stop the Servers

Run the following commands:
```bash
# Kill backend (port 3001)
lsof -ti:3001 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

## 📝 Notes

- **ESLint Warnings:** The frontend has some non-critical accessibility warnings about anchor tags. These don't affect functionality.
- **Data Sources:** Using LION street network (242,344 segments), 652,173 existing trees, and multiple constraint datasets.
- **Performance:** Tree planting validation uses parallel processing for sidewalk checks to handle large datasets efficiently.

---

**Generated:** January 16, 2026
**System:** NYC Climate Resilience & Urban Heat Island Mitigation Platform
