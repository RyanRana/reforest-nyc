import express from 'express';
import cors from 'cors';
import { H3Service } from './services/h3Service';
import { SimulationService } from './services/simulationService';
import { CongressionalService } from './services/congressionalService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const h3Service = new H3Service();
const simulationService = new SimulationService();
const congressionalService = new CongressionalService();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NYC Climate Resilience API (H3)',
    version: '2.0.0',
    spatial_unit: 'H3 Hexagonal Cells',
    endpoints: {
      health: '/health',
      h3_cell: '/h3/:cellId',
      all_h3: '/h3-cells',
      h3_boundaries: '/h3-boundaries',
      simulate: '/simulate?lat=...&lon=...',
      trees: '/trees?bbox=...'
    },
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get H3 cell data
app.get('/h3/:cellId', async (req, res) => {
  try {
    const cellId = req.params.cellId;
    const h3Data = await h3Service.getH3Data(cellId);

    if (!h3Data) {
      return res.status(404).json({ error: 'H3 cell not found' });
    }

    res.json(h3Data);
  } catch (error) {
    console.error('Error fetching H3 data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all H3 cells with priority scores
app.get('/h3-cells', async (req, res) => {
  try {
    const cells = await h3Service.getAllH3Cells();
    res.json(cells);
  } catch (error) {
    console.error('Error fetching H3 cells:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate impact for a location
app.get('/simulate', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid lat/lon parameters' });
    }
    
    const simulation = await simulationService.simulate(lat, lon);
    res.json(simulation);
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tree locations for visualization
app.get('/trees', async (req, res) => {
  try {
    const bbox = req.query.bbox as string;
    const trees = await h3Service.getTrees(bbox);
    res.json(trees);
  } catch (error) {
    console.error('Error fetching trees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get congressional data for a ZIP code
app.get('/congressional/:id', (req, res) => {
  try {
    const zipId = req.params.id;
    const data = congressionalService.getCongressionalData(zipId);
    
    if (!data) {
      return res.status(404).json({ error: 'Congressional data not found for this ZIP code' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching congressional data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get H3 boundaries GeoJSON
app.get('/h3-boundaries', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Determine base directory (works for both dev and production)
    const isDev = __dirname.includes('src');
    // backend/{src|dist}/ -> project root in three hops; avoid overshooting and
    // dropping the "urban futures" folder when the path contains spaces.
    const baseDir = isDev 
      ? path.resolve(__dirname, '../..')
      : path.resolve(__dirname, '../..');
    const geojsonPath = path.join(baseDir, 'data/models/h3_features.geojson');

    if (fs.existsSync(geojsonPath)) {
      const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
      res.json(geojson);
    } else {
      res.status(404).json({ error: 'H3 boundaries not found', path: geojsonPath });
    }
  } catch (error) {
    console.error('Error loading H3 boundaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all NYC ZIP codes
app.get('/zipcodes', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const isDev = __dirname.includes('src');
    const baseDir = isDev 
      ? path.resolve(__dirname, '../..')
      : path.resolve(__dirname, '../..');
    
    // Try to get ZIP codes from h3_features.json
    const h3JsonPath = path.join(baseDir, 'data/models/h3_features.json');
    const zipJsonPath = path.join(baseDir, 'data/models/zip_features.json');
    
    let zipcodes: string[] = [];
    
    if (fs.existsSync(h3JsonPath)) {
      const h3Data = JSON.parse(fs.readFileSync(h3JsonPath, 'utf-8'));
      const zipSet = new Set<string>();
      h3Data.forEach((feature: any) => {
        if (feature.zipcode && typeof feature.zipcode === 'string') {
          zipSet.add(feature.zipcode);
        }
      });
      zipcodes = Array.from(zipSet).sort((a, b) => parseInt(a) - parseInt(b));
    } else if (fs.existsSync(zipJsonPath)) {
      const zipData = JSON.parse(fs.readFileSync(zipJsonPath, 'utf-8'));
      zipcodes = zipData.map((feature: any) => feature.zipcode).filter(Boolean).sort((a: string, b: string) => parseInt(a) - parseInt(b));
    }
    
    res.json({ zipcodes });
  } catch (error) {
    console.error('Error loading ZIP codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

