import * as fs from 'fs';
import * as path from 'path';

interface CongressionalData {
  zipCode: string;
  congressionalLeader: string;
  congressionalDistrict: string;
  twitterLink: string;
  population: number | null;
  borough: string;
  sizeSqMiles: number | null;
  numberOfParks: number | null;
  medianIncome: number | null;
  equityScore: number | null;
}

export class CongressionalService {
  private dataCache: Map<string, CongressionalData> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      // Resolve base directory - handle both dev (ts-node) and production (compiled) paths
      const isDev = __dirname.includes('src');
      const baseDir = isDev
        ? path.resolve(__dirname, '../../..')
        : path.resolve(__dirname, '../../..');
      
      const csvPath = path.join(baseDir, 'data/nyc_zip_congressional_data.csv');
      console.log(`Loading congressional data from: ${csvPath}`);
      console.log(`File exists: ${fs.existsSync(csvPath)}`);
      
      if (!fs.existsSync(csvPath)) {
        console.error(`Congressional data file not found at: ${csvPath}`);
        return;
      }
      
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const columns = this.parseCSVLine(line);
        if (columns.length < 10) continue;
        
        const zipCode = columns[0].trim();
        const congressionalLeader = columns[1].trim();
        const congressionalDistrict = columns[2].trim();
        const twitterLink = columns[3].trim();
        const population = columns[4] && columns[4].trim() ? parseFloat(columns[4]) : null;
        const borough = columns[5].trim();
        const sizeSqMiles = columns[6] && columns[6].trim() ? parseFloat(columns[6]) : null;
        const numberOfParks = columns[7] && columns[7].trim() ? parseFloat(columns[7]) : null;
        const medianIncome = columns[8] && columns[8].trim() ? parseFloat(columns[8]) : null;
        const equityScore = columns[9] && columns[9].trim() ? parseFloat(columns[9]) : null;

        if (zipCode && congressionalLeader && congressionalLeader !== 'Data Needed') {
          this.dataCache.set(zipCode, {
            zipCode,
            congressionalLeader,
            congressionalDistrict,
            twitterLink,
            population,
            borough,
            sizeSqMiles,
            numberOfParks,
            medianIncome,
            equityScore
          });
        }
      }
      
      console.log(`Loaded ${this.dataCache.size} congressional data entries`);
    } catch (error) {
      console.error('Error loading congressional data:', error);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  }

  getCongressionalData(zipcode: string): CongressionalData | null {
    const data = this.dataCache.get(zipcode) || null;
    if (!data) {
      console.log(`No congressional data found for ZIP code: ${zipcode}`);
      console.log(`Available ZIP codes (first 10): ${Array.from(this.dataCache.keys()).slice(0, 10).join(', ')}`);
    }
    return data;
  }
}

