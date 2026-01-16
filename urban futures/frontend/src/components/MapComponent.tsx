import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/MapComponent.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXV4NTFpemMycmM4YzJ6N2RqN2gifQ.rJcFIG214AriISLbB6B5aw';

interface MapComponentProps {
  onH3Click: (h3Cell: string) => void;
  selectedH3: any;
}


// Helper function to safely get a layer (prevents getOwnLayer errors when style isn't loaded)
const safeGetLayer = (mapInstance: mapboxgl.Map, layerId: string): any => {
  try {
    // Check if map style is loaded
    if (!mapInstance || !mapInstance.getStyle) {
      return null;
    }
    const style = mapInstance.getStyle();
    if (!style || !style.layers) {
      return null;
    }
    // Now safe to call getLayer
    return mapInstance.getLayer(layerId);
  } catch (e) {
    // Silently fail if style isn't ready
    return null;
  }
};

const addH3GradientLayer = (mapInstance: mapboxgl.Map, onH3Click: (h3Cell: string) => void, geojson: any) => {
  console.log('🎨 ===== addH3GradientLayer CALLED =====');
  console.log('   Features count:', geojson.features?.length || 0);
  console.log('   Map instance valid:', !!mapInstance && typeof mapInstance.getSource === 'function');
  
  // Remove old layers and handlers if they exist
  try {

    if (safeGetLayer(mapInstance, 'h3-heatmap')) {
      mapInstance.removeLayer('h3-heatmap');
    }
    if (safeGetLayer(mapInstance, 'h3-gradient')) {
      mapInstance.removeLayer('h3-gradient');
    }
    if (safeGetLayer(mapInstance, 'h3-layer')) {
      // Removing the layer automatically removes all its event handlers
      mapInstance.removeLayer('h3-layer');
      console.log('🧹 Removed existing h3-layer');
    }
    if (safeGetLayer(mapInstance, 'h3-outline')) {
      mapInstance.removeLayer('h3-outline');
    }
    if (safeGetLayer(mapInstance, 'h3-highlight')) {
      mapInstance.removeLayer('h3-highlight');
    }
    if (mapInstance.getSource('h3-highlight')) {
      mapInstance.removeSource('h3-highlight');
    }
  } catch (e) {
    console.warn('⚠️ Error removing old layers (might not exist):', e);
  }

  // Create/update source with polygon data
  if (!mapInstance.getSource('h3-cells')) {
    mapInstance.addSource('h3-cells', {
      type: 'geojson',
      data: geojson
    });
    console.log('✅ Created h3-cells source with', geojson.features.length, 'features');
  } else {
    (mapInstance.getSource('h3-cells') as mapboxgl.GeoJSONSource).setData(geojson);
    console.log('✅ Updated h3-cells source with', geojson.features.length, 'features');
  }

  // Helper function to add layer and handlers
  const addLayerAndHandlers = () => {
    try {
      // Verify source exists and has data
      const source = mapInstance.getSource('h3-cells') as mapboxgl.GeoJSONSource;
      if (!source) {
        console.error('❌ Source h3-cells does not exist!');
        return;
      }
      
      const sourceData = (source as any)._data;
      if (!sourceData || !sourceData.features || sourceData.features.length === 0) {
        console.error('❌ Source h3-cells has no features!');
        return;
      }
      console.log(`✅ Source verified: ${sourceData.features.length} features available`);
      
      // Add fill layer with gradient colors - make colors darker/more visible
      if (!safeGetLayer(mapInstance, 'h3-layer')) {
        // Get all existing layer IDs to add our layer after the last one
        let beforeId: string | undefined;
        try {
          const layers = mapInstance.getStyle().layers || [];
          // Find a good place to insert - after water/land layers but before labels
          for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.type === 'fill' || layer.type === 'background') {
              beforeId = layer.id;
              break;
            }
          }
        } catch (e) {
          // If we can't determine layer order, add at the end
          console.warn('Could not determine layer order, adding at end');
        }
        
        const layerConfig: any = {
          id: 'h3-layer',
    type: 'fill',
          source: 'h3-cells',
          layout: {
            visibility: 'visible'
          },
    paint: {
            // Color based on priority_final score (0-1 scale)
            // Higher priority = darker green (more urgent tree planting needed)
            'fill-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'priority_final'], 0],
              0,
              '#e8f5e9',      // Very light green - low priority
              0.1,
              '#c8e6c9',      // Light green - low-medium priority
              0.2,
              '#a5d6a7',      // Light-medium green
              0.3,
              '#81c784',      // Medium green
              0.4,
              '#66bb6a',      // Medium-dark green
              0.5,
              '#4caf50',      // Dark green - medium-high priority
              0.6,
              '#388e3c',      // Darker green - high priority
              0.7,
              '#2e7d32',      // Very dark green - very high priority
              0.8,
              '#1b5e20',      // Darkest green - highest priority
              1.0,
              '#0d4f1c'       // Nearly black green - maximum priority
            ],
            'fill-opacity': 0.85, // High opacity for good visibility
            'fill-antialias': true
          }
        };
        
        if (beforeId) {
          mapInstance.addLayer(layerConfig, beforeId);
        } else {
          mapInstance.addLayer(layerConfig);
        }
        
        // Verify layer was added IMMEDIATELY
        const addedLayer = safeGetLayer(mapInstance, 'h3-layer');
        if (!addedLayer) {
          console.error('❌ Layer was not added!');
          return;
        }
        
        // Check layer properties immediately
        const visibility = mapInstance.getLayoutProperty('h3-layer', 'visibility');
        const opacity = mapInstance.getPaintProperty('h3-layer', 'fill-opacity');
        const fillColor = mapInstance.getPaintProperty('h3-layer', 'fill-color');
        
        console.log('✅ h3-layer added successfully and verified');
        console.log('   Layer visibility:', visibility);
        console.log('   Layer opacity:', opacity);
        console.log('   Fill color:', fillColor);
        
        // Check if layer is in the style
        const style = mapInstance.getStyle();
        const layerInStyle = style.layers?.find((l: any) => l.id === 'h3-layer');
        if (layerInStyle) {
          console.log('   ✅ Layer found in map style');
          console.log('   Layer type:', layerInStyle.type);
          console.log('   Layer source:', layerInStyle.source);
        } else {
          console.error('   ❌ Layer NOT found in map style!');
        }
      } else {
        console.log('⚠️ Layer h3-layer already exists, skipping add');
      }

      // Add click handler AFTER layer is added
      mapInstance.on('click', 'h3-layer', (e) => {
        if (e.features && e.features[0]) {
          const h3Cell = e.features[0].properties?.h3_cell;
          if (h3Cell) {
            console.log('🖱️ Clicked on H3 cell:', h3Cell);
            onH3Click(h3Cell);
          }
        }
      });

      // Cursor handlers
      mapInstance.on('mouseenter', 'h3-layer', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
  });

      mapInstance.on('mouseleave', 'h3-layer', () => {
      mapInstance.getCanvas().style.cursor = '';
      });

      mapInstance.triggerRepaint();
      
      console.log('✅ Click handlers attached, triggering repaint');
      
      // IMMEDIATE verification first
      try {
        const source = mapInstance.getSource('h3-cells') as mapboxgl.GeoJSONSource;
        if (source) {
          const sourceData = (source as any)._data;
          console.log('🔍 Immediate verification:');
          console.log('   Source loaded:', source.loaded());
          console.log('   Features in source:', sourceData?.features?.length || 0);
          if (sourceData?.features?.[0]?.geometry?.coordinates?.[0]?.[0]) {
            const coord = sourceData.features[0].geometry.coordinates[0][0];
            console.log(`   First feature first coord: [${coord[0]}, ${coord[1]}]`);
            console.log(`   Expected format: [lng, lat] for NYC around [-73.9, 40.7]`);
          }
        }
      } catch (e) {
        console.error('Error in immediate verification:', e);
      }
      
      // Final verification after a delay to ensure everything is ready
      setTimeout(() => {
        console.log('🔍 Starting delayed verification...');
        try {
          const layer = safeGetLayer(mapInstance, 'h3-layer');
          const source = mapInstance.getSource('h3-cells') as mapboxgl.GeoJSONSource;
          
          if (!layer) {
            console.error('❌ Verification failed - layer does not exist!');
            return;
          }
          
          if (!source) {
            console.error('❌ Verification failed - source does not exist!');
            return;
          }
          
          const sourceData = (source as any)._data;
          const visibility = mapInstance.getLayoutProperty('h3-layer', 'visibility');
          const opacity = mapInstance.getPaintProperty('h3-layer', 'fill-opacity');
          const fillColor = mapInstance.getPaintProperty('h3-layer', 'fill-color');
          
          console.log('🔍 ===== FINAL VERIFICATION =====');
          console.log('   ✅ Layer exists:', !!layer);
          console.log('   ✅ Source exists:', !!source);
          console.log('   ✅ Source loaded:', source.loaded());
          console.log('   ✅ Features in source:', sourceData?.features?.length || 0);
          console.log('   ✅ Layer visibility:', visibility);
          console.log('   ✅ Layer opacity:', opacity);
          console.log('   ✅ Fill color:', fillColor);
          console.log('   ✅ Fill color type:', Array.isArray(fillColor) ? 'expression' : typeof fillColor);
          
          // Log a sample feature to check coordinates
          if (sourceData?.features?.[0]) {
            const sampleFeature = sourceData.features[0];
            if (sampleFeature.geometry?.coordinates?.[0]?.[0]) {
              const firstCoord = sampleFeature.geometry.coordinates[0][0];
              console.log(`   📍 Sample coordinate (first feature, first point): [${firstCoord[0]}, ${firstCoord[1]}]`);
              console.log(`      (Should be [lng, lat] format. NYC is around [-73.9, 40.7])`);
            }
          }
          
          // Check if any features are in viewport
          const bounds = mapInstance.getBounds();
          if (bounds && sourceData?.features) {
            const featuresInView = sourceData.features.filter((f: any) => {
              if (f.geometry?.type === 'Polygon' && f.geometry.coordinates) {
                const coords = f.geometry.coordinates[0];
                return coords.some((coord: number[]) => {
                  try {
                    return bounds.contains([coord[0], coord[1]] as [number, number]);
                  } catch {
                    return false;
                  }
                });
              }
              return false;
            });
            console.log(`   ✅ Features in viewport: ${featuresInView.length} of ${sourceData.features.length}`);
            
            if (featuresInView.length === 0) {
              console.warn('⚠️ No features in current viewport - try zooming out or panning to see H3 cells');
            }
          }
        } catch (verificationError) {
          console.error('❌ Error during verification:', verificationError);
        }
      }, 1500);
      
      console.log('✅ Click handlers attached to h3-layer');
      
      // Create empty highlight source and layer structure for future use
      if (!mapInstance.getSource('h3-highlight')) {
        mapInstance.addSource('h3-highlight', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        console.log('✅ Created empty h3-highlight source');
      }
      
      if (!safeGetLayer(mapInstance, 'h3-highlight')) {
        try {
          mapInstance.addLayer({
            id: 'h3-highlight',
            type: 'line',
            source: 'h3-highlight',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-color': '#FFD700',
              'line-width': 5,
              'line-opacity': 1.0
            }
          }, 'h3-layer');
          console.log('✅ Created h3-highlight layer structure');
        } catch (highlightError) {
          console.warn('⚠️ Could not create highlight layer yet:', highlightError);
        }
      }
    } catch (error) {
      console.error('❌ Error adding h3-layer:', error);
    }
  };

  // Wait for source to be ready before adding layer
  console.log('⏭️ Proceeding to check source readiness...');
  try {
    const source = mapInstance.getSource('h3-cells') as mapboxgl.GeoJSONSource;
    if (!source) {
      console.error('❌ Source h3-cells does not exist in addH3GradientLayer! Cannot proceed.');
      return;
    }
    
    console.log('🔍 Checking source readiness...');
    console.log('   Source loaded?', source.loaded());
    console.log('   Source type:', source.type);
    
    if (source.loaded()) {
      // Source is already loaded, add layer immediately
      console.log('✅ Source is loaded, adding layer immediately');
      addLayerAndHandlers();
    } else {
      console.log('⏳ Source not loaded yet, waiting for sourcedata event...');
      // Wait for source data to load
      mapInstance.once('sourcedata', (e: any) => {
        console.log('📊 sourcedata event fired:', e.sourceId, e.isSourceLoaded);
        if (e.sourceId === 'h3-cells' && e.isSourceLoaded) {
          console.log('✅ Source is now loaded, adding layer');
          addLayerAndHandlers();
        }
      });
      
      // Also try to add after a delay as fallback
      setTimeout(() => {
        if (!safeGetLayer(mapInstance, 'h3-layer')) {
          console.log('⏰ Timeout fallback: attempting to add layer anyway');
          try {
            addLayerAndHandlers();
          } catch (e) {
            console.error('❌ Failed to add layer in timeout fallback:', e);
          }
        }
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Error checking source in addH3GradientLayer:', error);
    // Try to add layer anyway after a short delay
    setTimeout(() => {
      try {
        addLayerAndHandlers();
      } catch (e) {
        console.error('❌ Failed to add layer after delay:', e);
      }
    }, 500);
  }
};

// Helper function to update the highlight for selected H3 cell
const updateH3Highlight = (mapInstance: mapboxgl.Map, selectedH3: any, allH3Data: any) => {
  if (!mapInstance || !allH3Data) {
    console.warn('⚠️ Cannot update highlight: mapInstance or allH3Data missing');
    return;
  }

  try {
    // Find the selected feature by h3_cell ID
    // selectedH3 can be an H3Data object with h3_cell property, or null
    let selectedFeature = null;
    if (selectedH3) {
      const cellId = selectedH3.h3_cell || selectedH3;
      console.log('🔍 Looking for cell to highlight:', cellId);
      selectedFeature = allH3Data.features.find(
        (f: any) => f.properties?.h3_cell === cellId
      );
      if (selectedFeature) {
        console.log('✨ Found feature to highlight:', cellId);
      } else {
        console.warn('⚠️ Selected H3 cell not found in data:', cellId);
        console.log('   Available cells (first 5):', allH3Data.features.slice(0, 5).map((f: any) => f.properties?.h3_cell));
      }
    } else {
      console.log('🔘 No cell selected, clearing highlight');
    }

    // Create or update highlight source (always do this, even if empty)
    if (!mapInstance.getSource('h3-highlight')) {
      console.log('📦 Creating h3-highlight source');
      mapInstance.addSource('h3-highlight', {
        type: 'geojson',
        data: selectedFeature 
          ? { type: 'FeatureCollection', features: [selectedFeature] }
          : { type: 'FeatureCollection', features: [] }
      });
    } else {
      const highlightSource = mapInstance.getSource('h3-highlight') as mapboxgl.GeoJSONSource;
      console.log('📦 Updating h3-highlight source with', selectedFeature ? '1' : '0', 'features');
      highlightSource.setData(
        selectedFeature 
          ? { type: 'FeatureCollection', features: [selectedFeature] }
          : { type: 'FeatureCollection', features: [] }
      );
    }

    // Add highlight layer if it doesn't exist
    if (!mapInstance.getLayer('h3-highlight')) {
      // Wait for h3-layer to exist, or add it anyway
      const baseLayer = safeGetLayer(mapInstance, 'h3-layer');
      if (baseLayer) {
        console.log('✅ Adding h3-highlight layer after h3-layer');
        try {
          mapInstance.addLayer({
            id: 'h3-highlight',
            type: 'line',
            source: 'h3-highlight',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-color': '#FFD700', // Bright gold/yellow
              'line-width': 5, // Make it thicker for visibility
              'line-opacity': 1.0 // Full opacity
            }
          }, 'h3-layer'); // Add after h3-layer so it renders on top
          console.log('✅ h3-highlight layer added successfully');
        } catch (addError) {
          console.error('❌ Error adding highlight layer:', addError);
          // Try adding without beforeId as fallback
          try {
            mapInstance.addLayer({
              id: 'h3-highlight',
              type: 'line',
              source: 'h3-highlight',
              layout: {
                visibility: 'visible'
              },
              paint: {
                'line-color': '#FFD700',
                'line-width': 5,
                'line-opacity': 1.0
              }
            });
            console.log('✅ h3-highlight layer added (fallback method)');
          } catch (fallbackError) {
            console.error('❌ Failed to add highlight layer even with fallback:', fallbackError);
          }
        }
      } else {
        // If h3-layer doesn't exist yet, add highlight layer without beforeId
        console.log('⚠️ h3-layer not found, adding highlight layer without beforeId');
        try {
          mapInstance.addLayer({
            id: 'h3-highlight',
            type: 'line',
            source: 'h3-highlight',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-color': '#FFD700',
              'line-width': 5,
              'line-opacity': 1.0
            }
          });
          console.log('✅ h3-highlight layer added (without beforeId)');
        } catch (error) {
          console.error('❌ Error adding highlight layer:', error);
        }
      }
    } else {
      console.log('✅ h3-highlight layer already exists, source data updated');
      // Ensure visibility is set correctly
      mapInstance.setLayoutProperty('h3-highlight', 'visibility', 'visible');
    }
    
    // Force a repaint to ensure the highlight updates
    mapInstance.triggerRepaint();
  } catch (error) {
    console.error('❌ Error updating highlight:', error);
  }
};

const MapComponent: React.FC<MapComponentProps> = ({ onH3Click, selectedH3 }) => {
  const [allH3Data, setAllH3Data] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapStyle = 'mapbox://styles/mapbox/light-v11'; // Fixed light style for better hexagon visibility

  useEffect(() => {
    // Prevent double initialization (React StrictMode causes double renders)
    if (map.current) {
      console.log('⚠️ Map already initialized, skipping...');
      return;
    }
    
    if (!mapContainer.current) {
      console.error('❌ Map container ref is null!');
      return;
    }
    
    // Store reference to prevent cleanup during initialization
    const containerRef = mapContainer.current;
    let mapInstance: mapboxgl.Map | null = null;

    console.log('🗺️ Initializing Mapbox map...');
    console.log('📦 Container element:', mapContainer.current);
    
    // Check container dimensions
    const checkDimensions = () => {
      const width = mapContainer.current?.offsetWidth || 0;
      const height = mapContainer.current?.offsetHeight || 0;
      console.log('📏 Container dimensions:', { width, height });
      
      if (width === 0 || height === 0) {
        console.warn('⚠️ Container has zero dimensions! Map may not render.');
        console.warn('   This usually means the parent container needs height.');
      }
    };
    
    checkDimensions();
    
    // Check again after a short delay in case CSS hasn't applied yet
    setTimeout(checkDimensions, 100);
    
    // Set access token globally FIRST
    mapboxgl.accessToken = MAPBOX_TOKEN;
    console.log('🔑 Mapbox token set globally:', MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 20)}...` : 'NOT SET');
    console.log('🔑 Token length:', MAPBOX_TOKEN?.length || 0);

    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('mapbox')) {
      console.warn('⚠️ Using default Mapbox token. Set REACT_APP_MAPBOX_TOKEN in .env');
    }
    
    // Verify token is actually set
    if (mapboxgl.accessToken !== MAPBOX_TOKEN) {
      console.error('❌ Token mismatch! Global token not set correctly.');
    }

    try {
      console.log('🚀 Creating Mapbox instance...');
      
      // Use the selected map style
      const styleUrl = mapStyle;
      console.log('🎨 Style URL:', styleUrl);
      console.log('🔑 Using access token:', MAPBOX_TOKEN ? 'Set' : 'NOT SET');
      
      // For Mapbox GL JS v3.16.0, ensure accessToken is set globally BEFORE creating map
      // The map should use the global token automatically
      console.log('🔍 Verifying global token before map creation:', mapboxgl.accessToken ? 'Set' : 'NOT SET');
      
      const mapOptions: any = {
        container: mapContainer.current,
        style: styleUrl,
        center: [-73.9712, 40.7831], // NYC center
        zoom: 11,
      };
      
      console.log('📋 Map options (without token):', mapOptions);
      console.log('🚀 Creating map with style:', styleUrl);
      
      try {
        mapInstance = new mapboxgl.Map({
          container: containerRef, // Use stored ref
          style: styleUrl,
          center: [-73.9712, 40.7831],
        zoom: 12, // Higher zoom to see hexagons more clearly
        });
        map.current = mapInstance; // Store in ref
        console.log('✅ Map instance stored in ref');
      } catch (error) {
        console.error('❌ Map constructor threw error:', error);
        throw error;
      }
      
      console.log('✅ Map constructor completed');
      
      // Verify token after construction
      setTimeout(() => {
        const mapToken = (map.current as any)?._requestManager?._customAccessToken || 
                        (map.current as any)?.accessToken ||
                        mapboxgl.accessToken;
        console.log('🔍 Map access token after init:', mapToken ? `${mapToken.substring(0, 20)}...` : 'NOT FOUND');
      }, 100);

      console.log('✅ Map instance created, waiting for load event...');
      
      // Immediately check what's in the container
      setTimeout(() => {
        const container = mapContainer.current;
        console.log('📦 Container after map creation:', {
          children: Array.from(container?.children || []).map(c => ({
            tag: c.tagName,
            className: c.className,
            id: c.id
          })),
          innerHTML: container?.innerHTML.substring(0, 200)
        });
      }, 500);

      // Add timeout to detect if map never loads
      const loadTimeout = setTimeout(() => {
        if (!mapLoaded) {
          console.error('❌ Map load timeout! Map did not load within 10 seconds.');
          console.error('   This usually means:');
          console.error('   1. Mapbox token is invalid');
          console.error('   2. Network/CORS issue');
          console.error('   3. Mapbox style failed to load');
          console.error('   4. Web workers are blocked (check blob: requests in Network tab)');
          console.error('   Check Network tab for failed requests to api.mapbox.com');
          
          // Try to manually trigger render
          if (map.current) {
            console.log('🔄 Attempting to manually trigger map render...');
            try {
              map.current.resize();
              map.current.triggerRepaint();
            } catch (e) {
              console.error('❌ Failed to trigger render:', e);
            }
          }
        }
      }, 10000);

      map.current.on('load', async () => {
        clearTimeout(loadTimeout);
        setMapLoaded(true);
        console.log('✅ Map loaded successfully');
        console.log('📍 Map center:', map.current?.getCenter());
        console.log('🔍 Map zoom:', map.current?.getZoom());
      
        // Load H3 data FIRST, then create layers with the data
      if (map.current) {
          try {
            console.log('📥 Loading H3 GeoJSON data...');
            const response = await fetch('/h3_features.geojson');
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const geojson = await response.json();
            console.log(`📊 H3 GeoJSON loaded: ${geojson.features?.length || 0} features`);
            
            // Validate data
            if (!geojson.features || geojson.features.length === 0) {
              throw new Error('GeoJSON has no features');
            }
            
            // Clean up data and fix coordinate order (GeoJSON should be [lng, lat], not [lat, lng])
            // First pass: collect all tree densities to find max for normalization
            const treeDensities = geojson.features
              .map((f: any) => f.properties.tree_density_per_km2)
              .filter((d: any) => d != null && d !== undefined && !isNaN(d) && isFinite(d));
            const maxTreeDensity = treeDensities.length > 0 ? Math.max(...treeDensities) : 4000;
            const minTreeDensity = treeDensities.length > 0 ? Math.min(...treeDensities) : 0;
            
            console.log(`📊 Tree density stats: min=${minTreeDensity.toFixed(1)}, max=${maxTreeDensity.toFixed(1)}`);
            
            // Count how many features have priority_final
            const prioritiesBefore = geojson.features
              .map((f: any) => f.properties.priority_final)
              .filter((p: any) => p != null && p !== undefined && !isNaN(p) && isFinite(p));
            console.log(`📊 Priority stats: ${prioritiesBefore.length} of ${geojson.features.length} features have priority_final`);
            
            geojson.features = geojson.features.map((feature: any) => {
              const props = feature.properties;
              if (props.tree_density_per_km2 === null || props.tree_density_per_km2 === undefined) {
                props.tree_density_per_km2 = props.tree_count || 0;
              }
              
              // Calculate priority_final if it's missing or invalid
              if (props.priority_final === null || props.priority_final === undefined || isNaN(props.priority_final) || !isFinite(props.priority_final)) {
                // Use tree_gap (inverse of normalized tree density) as a proxy for priority
                // Higher tree gap = lower density = higher priority for planting
                const treeDensity = props.tree_density_per_km2 || 0;
                const normalizedDensity = maxTreeDensity > minTreeDensity 
                  ? (treeDensity - minTreeDensity) / (maxTreeDensity - minTreeDensity)
                  : 0;
                const treeGap = 1 - Math.max(0, Math.min(1, normalizedDensity)); // Clamp to 0-1
                
                // Scale tree gap to reasonable priority range (0-0.8)
                // Areas with very low tree density get highest priority
                props.priority_final = treeGap * 0.8;
              }
              
              // Ensure h3_cell property exists
              if (!props.h3_cell) {
                console.warn('Feature missing h3_cell:', feature);
              }
              
              // Fix coordinate order: GeoJSON spec requires [lng, lat], but data might be [lat, lng]
              if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
                let swappedCount = 0;
                feature.geometry.coordinates = feature.geometry.coordinates.map((ring: number[][]) => 
                  ring.map((coord: number[]) => {
                    // If first coordinate is > 0 and second is < 0, likely [lat, lng] -> swap to [lng, lat]
                    // NYC lat ~40, lng ~-73, so lat is positive and lng is negative
                    if (coord.length >= 2 && coord[0] > 0 && coord[1] < 0) {
                      swappedCount++;
                      return [coord[1], coord[0], ...coord.slice(2)];
                    }
                    return coord;
                  })
                );
                if (swappedCount > 0 && geojson.features.indexOf(feature) === 0) {
                  const firstCoord = feature.geometry.coordinates[0][0];
                  console.log(`🔄 Swapped coordinates for first feature: ${swappedCount} coordinates swapped from [lat, lng] to [lng, lat]`);
                  console.log(`   First coord is now [${firstCoord[0]}, ${firstCoord[1]}] (should be [lng, lat] format)`);
                  console.log(`   NYC should be around [-73.9, 40.7] - checking if this matches...`);
                  if (Math.abs(firstCoord[0]) < 75 && firstCoord[1] > 40 && firstCoord[1] < 41) {
                    console.log(`   ✅ Coordinates look correct: lng=${firstCoord[0]}, lat=${firstCoord[1]}`);
                  } else {
                    console.error(`   ❌ Coordinates look wrong! Expected lng ~-73, lat ~40, got [${firstCoord[0]}, ${firstCoord[1]}]`);
                  }
                }
              }
              
              return feature;
            });
            
            // Log final priority stats after computation
            const prioritiesAfter = geojson.features
              .map((f: any) => f.properties.priority_final)
              .filter((p: any) => p != null && p !== undefined && !isNaN(p) && isFinite(p));
            if (prioritiesAfter.length > 0) {
              const priorityValues = prioritiesAfter.map((p: any) => p);
              console.log(`📊 Final priority stats: ${prioritiesAfter.length} features have priority_final`);
              console.log(`   Min: ${Math.min(...priorityValues).toFixed(3)}, Max: ${Math.max(...priorityValues).toFixed(3)}`);
              console.log(`   Unique values: ${new Set(priorityValues.map((v: number) => v.toFixed(2))).size} unique (rounded to 2 decimals)`);
            }
            
            console.log(`📊 Processed ${geojson.features.length} features with valid data`);
            
            // Create source WITH data already loaded
            if (!map.current.getSource('h3-cells')) {
              map.current.addSource('h3-cells', {
                type: 'geojson',
                data: geojson
              });
              console.log('✅ Created h3-cells source with data');
            } else {
              // Update existing source
              const source = map.current.getSource('h3-cells') as mapboxgl.GeoJSONSource;
              source.setData(geojson);
              console.log('✅ Updated h3-cells source with data');
            }
            
            // Store data FIRST to prevent backup loader from running
            setAllH3Data(geojson);
            
            // Add gradient fill layer (will wait for source to be ready)
            addH3GradientLayer(map.current, onH3Click, geojson);
            
            console.log('✅ H3 gradient layer setup initiated');
            
          } catch (err) {
            console.error('❌ Error loading H3 GeoJSON:', err);
            // Try backend fallback
            try {
              const backendResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/h3-boundaries`);
              const geojson = await backendResponse.json();
              if (!map.current.getSource('h3-cells')) {
                map.current.addSource('h3-cells', {
                  type: 'geojson',
                  data: geojson
                });
              } else {
                (map.current.getSource('h3-cells') as mapboxgl.GeoJSONSource).setData(geojson);
              }
              setAllH3Data(geojson);
              addH3GradientLayer(map.current, onH3Click, geojson);
            } catch (err2) {
              console.error('❌ Backend fallback also failed:', err2);
            }
          }
      }
    });

      map.current.on('error', (e: any) => {
        clearTimeout(loadTimeout);
        console.error('❌ Mapbox error event fired:', e);
        console.error('Error type:', e.error?.type || 'unknown');
        console.error('Error message:', e.error?.message || 'no message');
        console.error('Error status:', e.error?.status || 'no status');
        if (e.error) {
          console.error('Full error object:', JSON.stringify(e.error, null, 2));
        }
      });
      
      // Check for style loading errors specifically
      map.current.on('error', (e: any) => {
        if (e.error?.message?.includes('style') || e.error?.type === 'style') {
          console.error('❌ STYLE ERROR DETECTED:', e.error);
        }
      });

      map.current.on('style.load', () => {
        console.log('🎨 Map style loaded');
      });

      map.current.on('style.error', (e: any) => {
        console.error('❌ Map style error:', e);
        console.error('   Error details:', e.error);
      });

      map.current.on('style.load', () => {
        console.log('🎨 Map style loaded successfully');
      });

      map.current.on('styleimagemissing', (e: any) => {
        console.warn('⚠️ Style image missing:', e.id);
      });

      map.current.on('data', (e: any) => {
        // Reduced logging - only log important events
        if (e.dataType === 'style') {
          console.log('📊 Style data loaded!');
          // Style loaded, canvas should appear soon
          setTimeout(() => {
            const canvas = mapContainer.current?.querySelector('canvas');
            if (canvas) {
              console.log('✅ Canvas appeared after style load!');
            }
          }, 500);
        }
        // Only log source data for our custom 'h3-cells' source
        if (e.dataType === 'source' && e.sourceId === 'h3-cells') {
          console.log('📊 H3 source data loaded');
        }
      });
      
      // Listen for style data specifically (reduced logging)
      // map.current.on('dataloading', (e: any) => {
      //   console.log('⏳ Data loading:', e.dataType, e);
      // });
      
      // Check if style response was successful (reduced logging)
      // map.current.on('styledata', (e: any) => {
      //   console.log('🎨 Style data event:', e);
      // });

      map.current.on('dataabort', (e: any) => {
        console.error('❌ Map data abort:', e);
      });

      map.current.on('sourcedataabort', (e: any) => {
        console.error('❌ Map source data abort:', e);
      });

      // The 'load' event handler above is the primary mechanism for detecting map readiness
      // No need for redundant timeout checks that cause false warnings
    } catch (error) {
      console.error('❌ Failed to create map:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }

    return () => {
      console.log('🧹 Cleaning up map...');
      try {
        if (mapInstance && typeof mapInstance.remove === 'function') {
        mapInstance.remove();
        mapInstance = null;
        }
      } catch (e) {
        console.warn('Error removing mapInstance:', e);
      }
      try {
        if (map.current && typeof map.current.remove === 'function') {
        map.current.remove();
        map.current = null;
        }
      } catch (e) {
        console.warn('Error removing map.current:', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount. onH3Click is stable and shouldn't trigger reinit.

  useEffect(() => {
    // Backup: Load H3 data if it wasn't loaded in the 'load' event
    // This is a fallback in case the map 'load' event handler didn't run
    // Only run if map is loaded, we have a map instance, no data loaded yet, and no source/layer exists
    if (!mapLoaded || !map.current) {
      return;
    }
    
    // Check if source or layer already exists (indicates main loader already ran)
    try {
      if (!map.current || typeof map.current.getSource !== 'function') {
        // Map not ready yet
        return;
      }
      
      const sourceExists = map.current.getSource('h3-cells');
      const layerExists = safeGetLayer(map.current, 'h3-layer');
      
      if (allH3Data || sourceExists || layerExists) {
        // Data already loaded or layers already set up
        return;
      }
    } catch (e) {
      // Map might not be fully initialized yet, skip backup
      console.log('⏭️ Skipping backup loader - map not ready:', e);
      return;
    }
    
    // Only run backup if we get here (no data, no source, no layer)
    console.log('📥 Backup: Loading H3 data (main loader didn\'t run)...');
    fetch('/h3_features.geojson')
      .then(res => res.json())
            .then(geojson => {
        if (!map.current) return; // Map was cleaned up
        
        // First pass: collect all tree densities to find max for normalization
        const treeDensities = geojson.features
          .map((f: any) => f.properties.tree_density_per_km2)
          .filter((d: any) => d != null && d !== undefined && !isNaN(d) && isFinite(d));
        const maxTreeDensity = treeDensities.length > 0 ? Math.max(...treeDensities) : 4000;
        const minTreeDensity = treeDensities.length > 0 ? Math.min(...treeDensities) : 0;
        
        geojson.features = geojson.features.map((feature: any) => {
          const props = feature.properties;
          if (props.tree_density_per_km2 === null || props.tree_density_per_km2 === undefined) {
            props.tree_density_per_km2 = props.tree_count || 0;
          }
          
          // Calculate priority_final if it's missing or invalid
          if (props.priority_final === null || props.priority_final === undefined || isNaN(props.priority_final) || !isFinite(props.priority_final)) {
            // Use tree_gap (inverse of normalized tree density) as a proxy for priority
            const treeDensity = props.tree_density_per_km2 || 0;
            const normalizedDensity = maxTreeDensity > minTreeDensity 
              ? (treeDensity - minTreeDensity) / (maxTreeDensity - minTreeDensity)
              : 0;
            const treeGap = 1 - Math.max(0, Math.min(1, normalizedDensity)); // Clamp to 0-1
            props.priority_final = treeGap * 0.8; // Scale to reasonable range
          }
          
          // Fix coordinate order: GeoJSON spec requires [lng, lat], but data might be [lat, lng]
          if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
            feature.geometry.coordinates = feature.geometry.coordinates.map((ring: number[][]) => 
              ring.map((coord: number[]) => {
                // If first coordinate is > 0 and second is < 0, likely [lat, lng] -> swap to [lng, lat]
                // NYC lat ~40, lng ~-73, so lat is positive and lng is negative
                if (coord.length >= 2 && coord[0] > 0 && coord[1] < 0) {
                  return [coord[1], coord[0], ...coord.slice(2)];
                }
                return coord;
              })
            );
          }
          
          return feature;
        });
        setAllH3Data(geojson);
        if (map.current) {
          addH3GradientLayer(map.current, onH3Click, geojson);
          console.log(`✅ Backup: Loaded ${geojson.features.length} H3 cells and created gradient layers`);
        }
            })
            .catch(err => {
        console.error('❌ Backup load failed:', err);
        if (!map.current) return;
        // Try backend
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/h3-boundaries`)
                .then(res => res.json())
                .then(geojson => {
            if (map.current) {
              setAllH3Data(geojson);
              addH3GradientLayer(map.current, onH3Click, geojson);
            }
          })
          .catch(console.error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, allH3Data]); // onH3Click is stable callback prop, shouldn't trigger re-runs

  // For H3 cells, we'll keep it simple for now - no complex filtering
  // H3 cells are identified by their hash, not human-readable names
  useEffect(() => {
    if (mapLoaded && map.current && allH3Data) {
      try {
        const source = map.current.getSource('h3-cells') as mapboxgl.GeoJSONSource;
      if (source) {
          // For now, always show all H3 cells
          // In the future, we could implement priority-based filtering
          source.setData(allH3Data);

          // Remove any filters
          if (safeGetLayer(map.current, 'h3-layer')) {
            map.current.setFilter('h3-layer', null);
          }

          console.log(`📊 Showing all ${allH3Data.features.length} H3 cells`);
        }
      } catch (error) {
        console.error('❌ Error updating H3 data:', error);
      }
    }
  }, [mapLoaded, allH3Data]);

  // Update highlight when selectedH3 changes
  useEffect(() => {
    if (mapLoaded && map.current && allH3Data) {
      // Small delay to ensure h3-layer exists before adding highlight
      const timer = setTimeout(() => {
        if (map.current && safeGetLayer(map.current, 'h3-layer')) {
          updateH3Highlight(map.current, selectedH3, allH3Data);
        } else {
          console.warn('⚠️ h3-layer not ready yet for highlight, retrying...');
          // Retry after a longer delay
          setTimeout(() => {
            if (map.current) {
              updateH3Highlight(map.current, selectedH3, allH3Data);
            }
          }, 500);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedH3, mapLoaded, allH3Data]);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
    </div>
  );
};

export default MapComponent;

