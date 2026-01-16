#ifndef IMPACT_MODEL_H
#define IMPACT_MODEL_H

#include <vector>
#include <string>
#include <memory>

class ImpactModel {
public:
    ImpactModel();
    ~ImpactModel();
    
    // Load model weights from JSON file
    bool loadModel(const std::string& weights_path);
    
    // Predict impact per dollar for a ZIP code
    double predict(const std::vector<double>& features);
    
    // Get model info
    int getNumFeatures() const { return n_features_; }
    bool isLoaded() const { return loaded_; }

private:
    bool loaded_;
    int n_features_;
    std::vector<double> coefficients_;
    double intercept_;
    std::vector<double> scaler_mean_;
    std::vector<double> scaler_scale_;
    
    // Helper: normalize features
    std::vector<double> normalize(const std::vector<double>& features);
};

#endif // IMPACT_MODEL_H




