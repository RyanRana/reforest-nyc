import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { H3Service } from './services/h3Service';
import { SimulationService } from './services/simulationService';
import { CongressionalService } from './services/congressionalService';
import { PredictionService } from './services/predictionService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const h3Service = new H3Service();
const simulationService = new SimulationService();
const congressionalService = new CongressionalService();
const predictionService = new PredictionService();

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
      trees: '/trees?bbox=...',
      predict: '/predict?h3_cell=...&years=...'
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

// Forward prediction endpoint
app.get('/predict', async (req, res) => {
  try {
    const h3_cell = req.query.h3_cell as string;
    const zipcode = req.query.zipcode as string;
    const years = parseInt(req.query.years as string) || 10;
    const tree_count = req.query.tree_count ? parseInt(req.query.tree_count as string) : undefined;
    
    if (!h3_cell && !zipcode) {
      return res.status(400).json({ error: 'Must provide either h3_cell or zipcode' });
    }
    
    const prediction = await predictionService.predictForward({
      h3_cell,
      zipcode,
      years,
      tree_count
    });
    
    res.json(prediction);
  } catch (error: any) {
    console.error('Error running prediction:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Contact form endpoint
app.post('/contact', async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    // Validate input
    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const recipientEmail = 'ryanrana04@gmail.com';
    
    // Format email content
    const emailContent = `
New Contact Form Submission from ReforestNYC

From: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent from the ReforestNYC contact form.
Timestamp: ${new Date().toISOString()}
    `.trim();

    // Try to send email using nodemailer
    // Check if email credentials are configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (emailUser && emailPass) {
      // Create transporter with email service credentials
      const transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      // Send email
      await transporter.sendMail({
        from: emailUser,
        replyTo: email,
        to: recipientEmail,
        subject: `[ReforestNYC Contact] ${subject}`,
        text: emailContent,
        html: `
          <h2>New Contact Form Submission from ReforestNYC</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>This message was sent from the ReforestNYC contact form.<br>
          Timestamp: ${new Date().toISOString()}</small></p>
        `
      });

      console.log(`✅ Email sent successfully to ${recipientEmail} from ${email}`);
    } else {
      // Log email if credentials not configured
      console.log('=== CONTACT FORM SUBMISSION ===');
      console.log(`To: ${recipientEmail}`);
      console.log(`From: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log('================================');
      console.log('⚠️  Email credentials not configured. Set EMAIL_USER and EMAIL_PASS environment variables to enable email sending.');
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully'
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

