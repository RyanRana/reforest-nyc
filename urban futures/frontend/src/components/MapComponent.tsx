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

const addH3GradientLayer = (mapInstance: mapboxgl.Map, onH3Click: (h3Cell: string) => void, geojson: any, viewMode: 'trees' | 'heat' = 'trees') => {
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
    // DON'T remove thermal-heat-overlay - it's managed separately
    // if (safeGetLayer(mapInstance, 'thermal-heat-overlay')) {
    //   mapInstance.removeLayer('thermal-heat-overlay');
    // }
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
        
        // Determine fill color based on view mode
        // Trees mode: green gradient based on priority_final (tree gap)
        // Heat mode: red gradient based on thermal value (heat index)
        let fillColorExpression: any;
        
        if (viewMode === 'trees') {
          // Green gradient for tree priority (current behavior)
          fillColorExpression = [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'priority_final'], 0],
            0, '#e8f5e9',      // Very light green - low priority
            0.1, '#c8e6c9',    // Light green
            0.2, '#a5d6a7',    // Light-medium green
            0.3, '#81c784',    // Medium green
            0.4, '#66bb6a',    // Medium-dark green
            0.5, '#4caf50',    // Dark green
            0.6, '#388e3c',    // Darker green
            0.7, '#2e7d32',    // Very dark green
            0.8, '#1b5e20',    // Darkest green
            1.0, '#0d4f1c'     // Nearly black green - maximum priority
          ];
        } else {
          // Red gradient for heat index
          // Use thermal_value which matches the thermal points calculation
          fillColorExpression = [
            'interpolate',
            ['linear'],
            [
              'coalesce',
              ['get', 'thermal_value'], // Use the same thermal value as thermal points
              ['get', 'earth2_temp_c'],
              ['get', 'heat_vulnerability_index'],
              ['get', 'heat_score'],
              ['get', 'thermal_proxy_normalized'], // Fallback to thermal proxy
              0.5 // Final fallback
            ],
            0, '#fff5f5',      // Very light pink - cool
            0.1, '#ffe5e5',    // Light pink
            0.2, '#ffcccc',    // Light-medium pink
            0.3, '#ffb3b3',    // Medium-light pink
            0.4, '#ff9999',    // Medium pink
            0.5, '#ff8080',    // Medium-dark pink
            0.6, '#ff6666',    // Dark pink
            0.7, '#ff4d4d',    // Dark red-pink
            0.8, '#ff3333',    // Dark red
            0.9, '#cc0000',    // Darker red
            1.0, '#990000'     // Darkest red - hottest
          ];
        }
        
        const layerConfig: any = {
          id: 'h3-layer',
          type: 'fill',
          source: 'h3-cells',
          layout: {
            visibility: 'visible'
          },
          paint: {
            'fill-color': fillColorExpression,
            'fill-opacity': 0.85, // Full opacity for clear visibility
            'fill-antialias': true
          }
        };
        
        // Add H3 layer AFTER thermal overlay (so it's on top and clickable)
        // If thermal overlay exists, add H3 layer after it (by not specifying beforeId)
        // If thermal overlay doesn't exist, just add normally
        if (beforeId) {
          // Thermal overlay exists - add H3 layer AFTER it (on top)
          mapInstance.addLayer(layerConfig);
        } else {
          // No thermal overlay - add normally
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
        
        // Thermal overlay will be added separately when source is ready
        // This ensures proper layer ordering (thermal below H3 cells)
        
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
      // Make sure thermal overlay doesn't block clicks by ensuring it's non-interactive
      mapInstance.on('click', 'h3-layer', (e) => {
        if (e.features && e.features[0]) {
          const h3Cell = e.features[0].properties?.h3_cell;
          if (h3Cell) {
            console.log('🖱️ Clicked on H3 cell:', h3Cell);
            onH3Click(h3Cell);
          }
        }
      });
      
      // Ensure thermal overlay is non-interactive (doesn't block clicks)
      if (safeGetLayer(mapInstance, 'thermal-heat-overlay')) {
        mapInstance.setFilter('thermal-heat-overlay', null); // No filter needed, just ensure it's non-interactive
      }

      // Cursor handlers
      mapInstance.on('mouseenter', 'h3-layer', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
  });

      mapInstance.on('mouseleave', 'h3-layer', () => {
      mapInstance.getCanvas().style.cursor = '';
      });

      mapInstance.triggerRepaint();
      
      console.log('✅ Click handlers attached, triggering repaint');
      
      // Ensure thermal overlay is on top after H3 layer is added
      try {
        const thermalSource = mapInstance.getSource('thermal-heat-points');
        if (thermalSource) {
          console.log('🔥 Re-ensuring thermal overlay is on top after H3 layer setup');
          const ensureThermalOnTop = () => {
            if (!mapInstance) return;
            
            const thermalLayer = safeGetLayer(mapInstance, 'thermal-heat-overlay');
            if (!thermalLayer) {
              console.log('🔥 Thermal layer not found, will be added separately');
              return;
            }
            
            // Get all layer IDs to find the last one
            try {
              const style = mapInstance.getStyle();
              const layers = style.layers || [];
              if (layers.length > 0) {
                const lastLayerId = layers[layers.length - 1].id;
                // Only move if it's not already last
                if (lastLayerId !== 'thermal-heat-overlay') {
                  mapInstance.moveLayer('thermal-heat-overlay');
                  console.log('✅ Moved thermal overlay to top (after all layers)');
                } else {
                  console.log('✅ Thermal overlay already on top');
                }
              }
            } catch (e) {
              console.warn('Could not move thermal layer:', e);
            }
          };
          setTimeout(ensureThermalOnTop, 200);
        }
      } catch (e) {
        // Source might not be ready yet
      }
      
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
  const [viewMode, setViewMode] = useState<'trees' | 'heat'>('trees'); // Toggle between trees (green) and heat (red)
  const mapStyle = 'mapbox://styles/mapbox/light-v11'; // Fixed light style for better hexagon visibility

  // Helper function to safely get a source (prevents errors when style isn't loaded)
  const safeGetSource = (mapInstance: mapboxgl.Map, sourceId: string): any => {
    try {
      // Check if map style is loaded
      if (!mapInstance || !mapInstance.getStyle) {
        return null;
      }
      const style = mapInstance.getStyle();
      if (!style || !style.sources) {
        return null;
      }
      // Now safe to call getSource
      return mapInstance.getSource(sourceId);
    } catch (e) {
      // Silently fail if style isn't ready
      return null;
    }
  };

  // Helper function to ensure thermal overlay layer is added
  const ensureThermalOverlay = (mapInstance: mapboxgl.Map) => {
    if (!mapInstance) {
      console.warn('⚠️ ensureThermalOverlay: mapInstance is null');
      return;
    }
    
    // Check if style is loaded first
    try {
      const style = mapInstance.getStyle();
      if (!style || !style.layers) {
        console.log('⏳ Map style not ready yet, will retry...');
        return;
      }
    } catch (e) {
      console.log('⏳ Map style check failed, will retry...');
      return;
    }
    
    const source = safeGetSource(mapInstance, 'thermal-heat-points') as mapboxgl.GeoJSONSource;
    if (!source) {
      console.log('⏳ Thermal source not ready yet, will retry...');
      return;
    }
    
    // Debug: Check if source has data and is loaded
    if (!source.loaded()) {
      console.log('⏳ Thermal source not loaded yet, waiting...');
      // Wait for source to load
      try {
        mapInstance.once('sourcedata', (e: any) => {
          if (e.sourceId === 'thermal-heat-points' && e.isSourceLoaded) {
            setTimeout(() => ensureThermalOverlay(mapInstance), 100);
          }
        });
      } catch (e) {
        console.warn('Could not wait for source load:', e);
      }
      return;
    }
    
    const sourceData = (source as any)._data;
    const featureCount = sourceData?.features?.length || 0;
    console.log(`🔥 ensureThermalOverlay: Source has ${featureCount} features`);
    
    if (featureCount === 0) {
      console.warn('⚠️ Thermal source has no features!');
      return;
    }
    
    // Check if layer already exists
    if (safeGetLayer(mapInstance, 'thermal-heat-overlay')) {
      // Just update visibility
      mapInstance.setLayoutProperty(
        'thermal-heat-overlay',
        'visibility',
        'none' // Always hidden - heat is shown in cells
      );
      return;
    }
    
    // Add the layer
    try {
      const thermalLayerConfig: any = {
        id: 'thermal-heat-overlay',
        type: 'heatmap',
        source: 'thermal-heat-points',
        layout: {
          visibility: 'none' // Always hidden - heat is shown in cells when heat mode is active
        },
        paint: {
          // Weight points by their thermal value (0-1 scale)
          // Use 'thermal' property or fallback to earth2_temp_normalized
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'thermal'], ['get', 'earth2_temp_normalized'], 0.5],
            0, 0.5,  // Higher minimum weight for better visibility
            0.3, 0.7,
            0.6, 0.85,
            1, 1
          ],
          // Intensity of the heatmap (higher = more intense)
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1.5,
            10, 2,
            12, 3,
            15, 4
          ],
          // Color gradient for the heatmap - start showing colors at very low density
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 100, 255, 0)',          // Transparent blue (cool)
            0.01, 'rgba(100, 150, 255, 0.5)',   // Light blue - visible at low density
            0.05, 'rgba(150, 200, 255, 0.6)',   // Pale blue
            0.1, 'rgba(100, 200, 255, 0.7)',    // Sky blue
            0.3, 'rgba(255, 255, 100, 0.8)',    // Yellow
            0.5, 'rgba(255, 200, 0, 0.9)',      // Orange-yellow
            0.7, 'rgba(255, 150, 0, 0.95)',     // Orange
            0.9, 'rgba(255, 80, 0, 0.98)',      // Red-orange
            1, 'rgba(255, 0, 0, 1)'             // Red (hot) - fully opaque
          ],
          // Radius of influence for each point (larger = more spread)
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 30,
            10, 50,
            12, 80,
            15, 120
          ],
          // Opacity of the entire heatmap layer (higher = more visible)
          'heatmap-opacity': 1.0
        }
      };
      
      // Add thermal layer - ensure it's on top
      try {
        // Check if h3-layer exists - if so, add thermal after it
        const h3Layer = safeGetLayer(mapInstance, 'h3-layer');
        
        if (h3Layer) {
          // H3 layer exists - add thermal layer after it (which puts it on top)
          mapInstance.addLayer(thermalLayerConfig);
          console.log('✅ Thermal layer added after h3-layer');
        } else {
          // No h3-layer yet - add thermal layer, will move it later
          mapInstance.addLayer(thermalLayerConfig);
          console.log('✅ Thermal layer added (h3-layer not present yet)');
        }
        
        // Force move to top to ensure it's visible
        setTimeout(() => {
          try {
            const style = mapInstance.getStyle();
            const layers = style.layers || [];
            const thermalIndex = layers.findIndex((l: any) => l.id === 'thermal-heat-overlay');
            const lastIndex = layers.length - 1;
            
            if (thermalIndex >= 0 && thermalIndex < lastIndex) {
              mapInstance.moveLayer('thermal-heat-overlay');
              console.log(`✅ Thermal layer moved from position ${thermalIndex} to top (${layers.length - 1})`);
            }
          } catch (e) {
            console.warn('Could not verify/move thermal layer position:', e);
          }
        }, 100);
        
        // Verify layer was added
        const addedLayer = safeGetLayer(mapInstance, 'thermal-heat-overlay');
        if (addedLayer) {
          const visibility = mapInstance.getLayoutProperty('thermal-heat-overlay', 'visibility');
          const opacity = mapInstance.getPaintProperty('thermal-heat-overlay', 'heatmap-opacity');
          const intensity = mapInstance.getPaintProperty('thermal-heat-overlay', 'heatmap-intensity');
          console.log(`✅ Thermal heat overlay layer added successfully!`);
          console.log(`   Visibility: ${visibility}`);
          console.log(`   Opacity: ${opacity}`);
          console.log(`   Intensity: ${intensity}`);
          console.log(`   Source features: ${featureCount}`);
          
          // Log a sample feature to verify data
          if (sourceData?.features?.[0]?.properties) {
            const sampleProps = sourceData.features[0].properties;
            console.log(`   Sample feature thermal value: ${sampleProps.thermal || sampleProps.earth2_temp_normalized || 'missing'}`);
          }
        } else {
          console.error('❌ Failed to add thermal overlay layer!');
        }
      } catch (e: any) {
        console.error('❌ Error adding thermal overlay:', e);
        // If layer already exists, just update visibility
        if (safeGetLayer(mapInstance, 'thermal-heat-overlay')) {
          mapInstance.setLayoutProperty('thermal-heat-overlay', 'visibility', 'none'); // Always hidden
          console.log('✅ Thermal overlay already exists, updated visibility');
        } else {
          console.error('❌ Layer does not exist and could not be created:', e.message);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not add thermal overlay:', e);
    }
  };

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
            
            // Count how many features have heat_vulnerability_index
            const heatIndices = geojson.features
              .map((f: any) => f.properties.heat_vulnerability_index)
              .filter((h: any) => h != null && h !== undefined && !isNaN(h) && isFinite(h));
            console.log(`🌡️ Heat index stats: ${heatIndices.length} of ${geojson.features.length} features have heat_vulnerability_index`);
            if (heatIndices.length > 0) {
              const minHeat = Math.min(...heatIndices);
              const maxHeat = Math.max(...heatIndices);
              console.log(`   Heat range: ${minHeat.toFixed(3)} - ${maxHeat.toFixed(3)}`);
            }
            
            // Create point-based GeoJSON for thermal overlay (centroids of H3 cells)
            // Using NVIDIA Earth-2 thermal region temperature data
            const thermalPoints: any = {
              type: 'FeatureCollection',
              features: []
            };
            
            // First pass: collect all Earth-2 temperatures to find min/max for normalization
            const earth2Temps = geojson.features
              .map((f: any) => f.properties.earth2_temp_c)
              .filter((t: any) => t != null && t !== undefined && !isNaN(t) && isFinite(t));
            const maxEarth2Temp = earth2Temps.length > 0 ? Math.max(...earth2Temps) : 35; // Default max 35°C (~95°F)
            const minEarth2Temp = earth2Temps.length > 0 ? Math.min(...earth2Temps) : 0; // Default min 0°C
            
            // Collect thermal proxy values (tree gap, inverse tree density, population density, building density)
            // for normalization when Earth-2 data is missing
            const thermalProxies: number[] = [];
            geojson.features.forEach((f: any) => {
              const props = f.properties;
              // Create thermal proxy: inverse tree density + population/building density
              // Low trees + high density = high heat
              const treeDensity = props.tree_density_per_km2 || 0;
              const normalizedTreeDensity = maxTreeDensity > minTreeDensity 
                ? (treeDensity - minTreeDensity) / (maxTreeDensity - minTreeDensity)
                : 0.5;
              const treeGap = 1 - Math.max(0, Math.min(1, normalizedTreeDensity)); // Inverse: 0 = many trees, 1 = few trees
              
              const popDensity = props.population_density || 0;
              const buildingDensity = props.building_density || 0.5;
              
              // Combine factors: tree gap (60%), population density (25%), building density (15%)
              const thermalProxy = (treeGap * 0.6) + (Math.min(popDensity / 50000, 1) * 0.25) + (buildingDensity * 0.15);
              thermalProxies.push(thermalProxy);
            });
            
            const maxThermalProxy = thermalProxies.length > 0 ? Math.max(...thermalProxies) : 1;
            const minThermalProxy = thermalProxies.length > 0 ? Math.min(...thermalProxies) : 0;
            
            console.log(`🌡️ Earth-2 Temperature stats: ${earth2Temps.length} of ${geojson.features.length} features have earth2_temp_c`);
            if (earth2Temps.length > 0) {
              console.log(`   Temperature range: ${minEarth2Temp.toFixed(1)}°C - ${maxEarth2Temp.toFixed(1)}°C`);
              console.log(`   (${((minEarth2Temp * 9/5) + 32).toFixed(1)}°F - ${((maxEarth2Temp * 9/5) + 32).toFixed(1)}°F)`);
            }
            if (earth2Temps.length === 0) {
              console.log(`   Using thermal proxy (tree gap + population/building density) for visualization`);
              console.log(`   Thermal proxy range: ${minThermalProxy.toFixed(3)} - ${maxThermalProxy.toFixed(3)}`);
            }
            
            geojson.features = geojson.features.map((feature: any) => {
              const props = feature.properties;
              if (props.tree_density_per_km2 === null || props.tree_density_per_km2 === undefined) {
                props.tree_density_per_km2 = props.tree_count || 0;
              }
              
              // Calculate and store thermal proxy for heat index visualization
              // Low trees + high density = high heat
              const treeDensity = props.tree_density_per_km2 || 0;
              const normalizedTreeDensity = maxTreeDensity > minTreeDensity 
                ? (treeDensity - minTreeDensity) / (maxTreeDensity - minTreeDensity)
                : 0.5;
              const treeGap = 1 - Math.max(0, Math.min(1, normalizedTreeDensity)); // Inverse: 0 = many trees, 1 = few trees
              
              const popDensity = (props.population_density || 0) / 1000; // Normalize by dividing by 1000
              const buildingDensity = Math.min(props.building_density || 0.5, 1); // Ensure 0-1 range
              
              // Combine factors: tree gap (60%), population density (25%), building density (15%)
              const popNorm = Math.min(popDensity / 50, 1); // Normalize population (assume max ~50k per km2)
              const thermalProxy = Math.max(0, Math.min(1, (treeGap * 0.6) + (popNorm * 0.25) + (buildingDensity * 0.15)));
              
              // Normalize thermal proxy to 0-1 scale using collected range
              let normalizedThermal = thermalProxy;
              if (maxThermalProxy > minThermalProxy && maxThermalProxy > 0) {
                normalizedThermal = (thermalProxy - minThermalProxy) / (maxThermalProxy - minThermalProxy);
              }
              normalizedThermal = Math.max(0, Math.min(1, normalizedThermal)); // Clamp to 0-1
              
              // Store normalized thermal proxy in feature properties for heat index mode
              props.thermal_proxy_normalized = normalizedThermal;
              
              // Also calculate the final thermal value (same as used in thermal points)
              // This will be used for heat index visualization
              let earth2Temp = props.earth2_temp_c;
              let usingProxy = false;
              
              if (earth2Temp == null || earth2Temp === undefined || isNaN(earth2Temp) || !isFinite(earth2Temp)) {
                // Use the thermal proxy we just calculated
                if (maxThermalProxy > minThermalProxy && maxThermalProxy > 0) {
                  earth2Temp = normalizedThermal;
                } else {
                  earth2Temp = thermalProxy; // Use as-is if no range
                }
                earth2Temp = Math.max(0, Math.min(1, earth2Temp || 0.5));
                usingProxy = true;
              } else {
                // Normalize Earth-2 temperature to 0-1 scale
                if (maxEarth2Temp > minEarth2Temp) {
                  earth2Temp = (earth2Temp - minEarth2Temp) / (maxEarth2Temp - minEarth2Temp);
                } else {
                  earth2Temp = 0.5; // Default to middle if no range
                }
                earth2Temp = Math.max(0, Math.min(1, earth2Temp || 0.5));
              }
              
              // Final safety check - ensure we always have a valid value
              if (!isFinite(earth2Temp) || earth2Temp == null) {
                earth2Temp = 0.5; // Default middle value
              }
              
              // Store the final thermal value (same calculation as thermal points)
              const thermalValue = Math.max(0.1, Math.min(1, earth2Temp || 0.5));
              props.thermal_value = thermalValue; // Store for heat index mode
              
              // Calculate centroid for thermal overlay point
              if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
                const coords = feature.geometry.coordinates[0]; // First ring
                let sumLng = 0, sumLat = 0;
                let count = 0;
                for (const coord of coords) {
                  if (coord && coord.length >= 2) {
                    sumLng += coord[0];
                    sumLat += coord[1];
                    count++;
                  }
                }
                if (count > 0) {
                  const centroid = [sumLng / count, sumLat / count];
                  
                  // Use the thermal value we already calculated above (stored in props.thermal_value)
                  const thermalValue = props.thermal_value;
                  
                  thermalPoints.features.push({
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: centroid
                    },
                    properties: {
                      // Primary thermal value for heatmap weight
                      thermal: thermalValue,
                      // Also store normalized value
                      earth2_temp_normalized: thermalValue,
                      // Keep raw values for reference
                      earth2_temp_c: props.earth2_temp_c || null,
                      heat_vulnerability_index: props.heat_vulnerability_index || null,
                      heat_score: props.heat_score || null,
                      h3_cell: props.h3_cell
                    }
                  });
                }
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
            
            // Collect all thermal values to find range for final normalization
            const allThermalValues = geojson.features
              .map((f: any) => f.properties.thermal_value)
              .filter((v: any) => v != null && !isNaN(v) && isFinite(v));
            
            const minThermalValue = allThermalValues.length > 0 ? Math.min(...allThermalValues) : 0;
            const maxThermalValue = allThermalValues.length > 0 ? Math.max(...allThermalValues) : 1;
            
            console.log(`🔥 Thermal value range before normalization: min=${minThermalValue.toFixed(3)}, max=${maxThermalValue.toFixed(3)}`);
            
            // Normalize all thermal values to 0-1 range for better color distribution
            if (maxThermalValue > minThermalValue && allThermalValues.length > 0) {
              geojson.features.forEach((feature: any) => {
                if (feature.properties.thermal_value != null && !isNaN(feature.properties.thermal_value)) {
                  const normalized = (feature.properties.thermal_value - minThermalValue) / (maxThermalValue - minThermalValue);
                  feature.properties.thermal_value = Math.max(0, Math.min(1, normalized));
                }
              });
              console.log(`   ✅ Normalized thermal values to 0-1 range`);
            }
            
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
            console.log(`🔥 Thermal points created: ${thermalPoints.features.length} points`);
            
            // Log sample thermal values for debugging
            if (thermalPoints.features.length > 0) {
              const sampleValues = thermalPoints.features.slice(0, 5).map((f: any) => ({
                thermal: f.properties.thermal || f.properties.earth2_temp_normalized,
                h3: f.properties.h3_cell
              }));
              console.log(`   Sample thermal values:`, sampleValues);
              
              // Also log thermal_value from H3 features
              const sampleH3ThermalValues = geojson.features.slice(0, 10).map((f: any) => ({
                thermal_value: f.properties.thermal_value,
                thermal_proxy_normalized: f.properties.thermal_proxy_normalized,
                h3: f.properties.h3_cell
              }));
              console.log(`   Sample H3 thermal_value properties:`, sampleH3ThermalValues);
              
              // Check range of thermal values
              const thermalValues = geojson.features
                .map((f: any) => f.properties.thermal_value)
                .filter((v: any) => v != null && !isNaN(v));
              if (thermalValues.length > 0) {
                console.log(`   Thermal value stats: min=${Math.min(...thermalValues).toFixed(3)}, max=${Math.max(...thermalValues).toFixed(3)}, count=${thermalValues.length}`);
              } else {
                console.warn(`   ⚠️ No thermal_value properties found in H3 features!`);
              }
            }
            
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
            
            // Add thermal overlay source (point-based for smooth blobby effect)
            // Using NVIDIA Earth-2 thermal region temperature data
            if (map.current && thermalPoints.features.length > 0) {
              if (!map.current.getSource('thermal-heat-points')) {
                map.current.addSource('thermal-heat-points', {
                  type: 'geojson',
                  data: thermalPoints
                });
                console.log(`✅ Thermal heat points source created: ${thermalPoints.features.length} points`);
              } else {
                (map.current.getSource('thermal-heat-points') as mapboxgl.GeoJSONSource).setData(thermalPoints);
                console.log(`✅ Thermal heat points source updated: ${thermalPoints.features.length} points`);
              }
              
              // Ensure thermal overlay layer is added when source is ready
              // Wait for h3-layer to be added first, then add thermal on top
              const thermalSource = map.current.getSource('thermal-heat-points') as mapboxgl.GeoJSONSource;
              
              const addThermalWhenReady = () => {
                if (!map.current) return;
                
                // Wait for both source and h3-layer to be ready
                if (thermalSource.loaded() && safeGetLayer(map.current, 'h3-layer')) {
                  ensureThermalOverlay(map.current);
                } else {
                  // Retry after a delay
                  setTimeout(() => {
                    if (map.current && thermalSource.loaded()) {
                      ensureThermalOverlay(map.current);
                    }
                  }, 500);
                }
              };
              
              if (thermalSource.loaded()) {
                // Source is ready, but wait for h3-layer
                if (safeGetLayer(map.current, 'h3-layer')) {
                  addThermalWhenReady();
                } else {
                  // Wait for h3-layer to be added
                  map.current.once('sourcedata', (e: any) => {
                    if (e.sourceId === 'h3-cells' && e.isSourceLoaded) {
                      setTimeout(addThermalWhenReady, 300);
                    }
                  });
                  // Also try after timeout
                  setTimeout(addThermalWhenReady, 1000);
                }
              } else {
                // Wait for thermal source to load
                map.current.once('sourcedata', (e: any) => {
                  if (e.sourceId === 'thermal-heat-points' && e.isSourceLoaded && map.current) {
                    setTimeout(addThermalWhenReady, 300);
                  }
                });
              }
            } else {
              console.warn('⚠️ No thermal points created - thermal overlay will not be visible');
            }
            
            // Add gradient fill layer (will wait for source to be ready)
            addH3GradientLayer(map.current, onH3Click, geojson, viewMode);
            
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

  // Toggle thermal overlay visibility and ensure layer exists
  useEffect(() => {
    if (mapLoaded && map.current && allH3Data) {
      // Update visibility if layer exists
      if (map.current) {
        const layer = safeGetLayer(map.current, 'thermal-heat-overlay');
        if (layer) {
          map.current.setLayoutProperty(
            'thermal-heat-overlay',
            'visibility',
            'none' // Always hidden - heat is shown in cells
          );
        }
      }
      
      // Wait a bit for layers to be set up, then ensure thermal overlay
      const timer1 = setTimeout(() => {
        if (map.current) {
          console.log('🔥 useEffect: Ensuring thermal overlay after H3 layer setup');
          ensureThermalOverlay(map.current);
          
          // Double-check after another delay
          setTimeout(() => {
            if (map.current) {
              const layer = safeGetLayer(map.current, 'thermal-heat-overlay');
              const source = safeGetSource(map.current, 'thermal-heat-points');
              if (!layer && source) {
                console.log('🔥 Retrying thermal overlay addition...');
                ensureThermalOverlay(map.current);
              }
            }
          }, 1000);
        }
      }, 500);
      
      // If source exists but layer doesn't, wait a bit and try again
      let timer2: NodeJS.Timeout | null = null;
      if (map.current) {
        const source = safeGetSource(map.current, 'thermal-heat-points');
        const layer = safeGetLayer(map.current, 'thermal-heat-overlay');
        if (source && !layer) {
          timer2 = setTimeout(() => {
            if (map.current) {
              ensureThermalOverlay(map.current);
            }
          }, 500);
        }
      }
      
      // Also listen for source data events to add layer when source becomes ready
      let handleSourceData: ((e: any) => void) | null = null;
      if (map.current) {
        const source = safeGetSource(map.current, 'thermal-heat-points');
        if (source) {
          handleSourceData = () => {
            if (map.current && !safeGetLayer(map.current, 'thermal-heat-overlay')) {
              ensureThermalOverlay(map.current);
            }
          };
          map.current.on('sourcedata', handleSourceData);
        }
      }
      
      return () => {
        clearTimeout(timer1);
        if (timer2) clearTimeout(timer2);
        if (map.current && handleSourceData) {
          map.current.off('sourcedata', handleSourceData);
        }
      };
    }
  }, [mapLoaded, allH3Data]); // Removed showThermalOverlay dependency

  // Update H3 layer colors when view mode changes
  useEffect(() => {
    if (mapLoaded && map.current) {
      const layer = safeGetLayer(map.current, 'h3-layer');
      if (layer) {
        // Build the color expression based on view mode
        let fillColorExpression: any;
        
        if (viewMode === 'trees') {
          // Green gradient for tree priority
          fillColorExpression = [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'priority_final'], 0],
            0, '#e8f5e9',      // Very light green
            0.1, '#c8e6c9',
            0.2, '#a5d6a7',
            0.3, '#81c784',
            0.4, '#66bb6a',
            0.5, '#4caf50',
            0.6, '#388e3c',
            0.7, '#2e7d32',
            0.8, '#1b5e20',
            1.0, '#0d4f1c'     // Darkest green
          ];
        } else {
          // Red gradient for heat index
          // Use thermal_value which matches the thermal points calculation
          // Note: thermal_value is already normalized 0-1, so we use it directly
          fillColorExpression = [
            'interpolate',
            ['linear'],
            [
              'coalesce',
              ['get', 'thermal_value'], // Use the same thermal value as thermal points (0-1 range)
              ['get', 'thermal_proxy_normalized'], // Fallback to thermal proxy
              ['get', 'earth2_temp_c'],
              ['get', 'heat_vulnerability_index'],
              ['get', 'heat_score'],
              0.5 // Final fallback
            ],
            0, '#fff5f5',      // Very light pink/red - cool
            0.1, '#ffe5e5',    // Light pink
            0.2, '#ffcccc',    // Light-medium pink
            0.3, '#ffb3b3',    // Medium-light pink
            0.4, '#ff9999',    // Medium pink
            0.5, '#ff8080',    // Medium-dark pink
            0.6, '#ff6666',    // Dark pink
            0.7, '#ff4d4d',    // Dark red-pink
            0.8, '#ff3333',    // Dark red
            0.9, '#cc0000',    // Darker red
            1.0, '#990000'     // Darkest red - hottest
          ];
        }
        
        map.current.setPaintProperty('h3-layer', 'fill-color', fillColorExpression);
        
        // Force a repaint to ensure colors update
        map.current.triggerRepaint();
        
        console.log(`📊 H3 layer updated to ${viewMode} mode`);
        if (viewMode === 'heat') {
          console.log(`   Using thermal_value for heat index colors`);
          console.log(`   Color expression:`, fillColorExpression);
          
          // Verify thermal values in source
          try {
            const source = safeGetSource(map.current, 'h3-cells');
            if (source) {
              const sourceData = (source as any)._data;
              if (sourceData?.features) {
                const thermalValues = sourceData.features
                  .slice(0, 10)
                  .map((f: any) => f.properties?.thermal_value)
                  .filter((v: any) => v != null);
                console.log(`   Sample thermal_value from source:`, thermalValues);
                
                const allThermalVals = sourceData.features
                  .map((f: any) => f.properties?.thermal_value)
                  .filter((v: any) => v != null && !isNaN(v));
                if (allThermalVals.length > 0) {
                  const minVal = Math.min(...allThermalVals);
                  const maxVal = Math.max(...allThermalVals);
                  const avgVal = allThermalVals.reduce((a: number, b: number) => a + b, 0) / allThermalVals.length;
                  console.log(`   Source thermal_value stats:`);
                  console.log(`      Range: min=${minVal.toFixed(3)}, max=${maxVal.toFixed(3)}`);
                  console.log(`      Average: ${avgVal.toFixed(3)}, count=${allThermalVals.length}`);
                  console.log(`      Values < 0.3: ${allThermalVals.filter((v: number) => v < 0.3).length}`);
                  console.log(`      Values 0.3-0.6: ${allThermalVals.filter((v: number) => v >= 0.3 && v < 0.6).length}`);
                  console.log(`      Values 0.6-0.9: ${allThermalVals.filter((v: number) => v >= 0.6 && v < 0.9).length}`);
                  console.log(`      Values >= 0.9: ${allThermalVals.filter((v: number) => v >= 0.9).length}`);
                }
              }
            }
          } catch (e) {
            console.warn('Could not verify thermal values in source:', e);
          }
        }
        
        // Hide thermal overlay when in heat mode (heat is shown in cells)
        const thermalLayer = safeGetLayer(map.current, 'thermal-heat-overlay');
        if (thermalLayer) {
          map.current.setLayoutProperty(
            'thermal-heat-overlay',
            'visibility',
            viewMode === 'heat' ? 'none' : 'none' // Always hide - heat shown in cells
          );
        }
      }
    }
  }, [viewMode, mapLoaded]);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      {/* View mode toggle */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '0.75rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>View Mode:</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input
            type="radio"
            name="viewMode"
            value="trees"
            checked={viewMode === 'trees'}
            onChange={(e) => setViewMode('trees')}
            style={{ cursor: 'pointer' }}
          />
          <span>🟢 Trees (Priority)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input
            type="radio"
            name="viewMode"
            value="heat"
            checked={viewMode === 'heat'}
            onChange={(e) => setViewMode('heat')}
            style={{ cursor: 'pointer' }}
          />
          <span>🌡️ Heat Index</span>
        </label>
      </div>
    </div>
  );
};

export default MapComponent;

