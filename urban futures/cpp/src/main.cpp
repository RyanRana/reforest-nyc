#include "impact_model.h"
#include <iostream>
#include <vector>

int main() {
    ImpactModel model;
    
    // Load model (adjust path as needed)
    std::string model_path = "../../data/models/impact_model.bin";
    if (!model.loadModel(model_path)) {
        std::cerr << "Failed to load model" << std::endl;
        return 1;
    }
    
    // Example prediction
    std::vector<double> features = {
        0.5,  // heat_score
        0.3,  // air_quality_score
        0.2,  // tree_density
        0.4,  // cooling_site_distance_norm
        1000.0,  // total_fuel_oil_gallons
        0.6,  // ej_score
        0.3,  // pollution_proxy
        0.5,  // building_density
        0.1,  // parks_coverage
        0.2,  // flood_risk
        500.0,  // population_density
        0.0   // planting_history
    };
    
    double impact = model.predict(features);
    std::cout << "Predicted impact per dollar: " << impact << std::endl;
    
    return 0;
}




