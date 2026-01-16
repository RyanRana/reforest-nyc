#include "impact_model.h"
#include <fstream>
#include <sstream>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

ImpactModel::ImpactModel() : loaded_(false), n_features_(0), intercept_(0.0) {
}

ImpactModel::~ImpactModel() {
}

bool ImpactModel::loadModel(const std::string& weights_path) {
    try {
        std::ifstream file(weights_path);
        if (!file.is_open()) {
            std::cerr << "Error: Could not open model file: " << weights_path << std::endl;
            return false;
        }
        
        json j;
        file >> j;
        
        // Load coefficients
        if (j.contains("coef") && j["coef"].is_array()) {
            coefficients_.clear();
            for (const auto& val : j["coef"]) {
                coefficients_.push_back(val.get<double>());
            }
        }
        
        // Load intercept
        if (j.contains("intercept")) {
            intercept_ = j["intercept"].get<double>();
        }
        
        // Load scaler parameters
        if (j.contains("scaler_mean") && j["scaler_mean"].is_array()) {
            scaler_mean_.clear();
            for (const auto& val : j["scaler_mean"]) {
                scaler_mean_.push_back(val.get<double>());
            }
        }
        
        if (j.contains("scaler_scale") && j["scaler_scale"].is_array()) {
            scaler_scale_.clear();
            for (const auto& val : j["scaler_scale"]) {
                scaler_scale_.push_back(val.get<double>());
            }
        }
        
        // Set number of features
        n_features_ = coefficients_.size();
        
        // Validate
        if (n_features_ == 0 || scaler_mean_.size() != n_features_ || scaler_scale_.size() != n_features_) {
            std::cerr << "Error: Invalid model dimensions" << std::endl;
            return false;
        }
        
        loaded_ = true;
        std::cout << "Model loaded successfully. Features: " << n_features_ << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "Error loading model: " << e.what() << std::endl;
        return false;
    }
}

std::vector<double> ImpactModel::normalize(const std::vector<double>& features) {
    std::vector<double> normalized(n_features_);
    
    for (size_t i = 0; i < n_features_; ++i) {
        if (scaler_scale_[i] > 1e-6) {
            normalized[i] = (features[i] - scaler_mean_[i]) / scaler_scale_[i];
        } else {
            normalized[i] = 0.0;
        }
    }
    
    return normalized;
}

double ImpactModel::predict(const std::vector<double>& features) {
    if (!loaded_) {
        std::cerr << "Error: Model not loaded" << std::endl;
        return 0.0;
    }
    
    if (features.size() != static_cast<size_t>(n_features_)) {
        std::cerr << "Error: Feature size mismatch. Expected " << n_features_ 
                  << ", got " << features.size() << std::endl;
        return 0.0;
    }
    
    // Normalize features
    std::vector<double> normalized = normalize(features);
    
    // Compute linear prediction: y = intercept + sum(coef[i] * x[i])
    double prediction = intercept_;
    for (size_t i = 0; i < normalized.size(); ++i) {
        prediction += coefficients_[i] * normalized[i];
    }
    
    return prediction;
}




