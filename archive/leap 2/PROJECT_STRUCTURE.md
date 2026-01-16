# ML Climate Emulator - Project Structure

## Recommended Directory Layout

```
nycleap/
│
├── README.md                          # Project overview and setup instructions
├── LICENSE                            # Project license
├── .gitignore                         # Git ignore rules
├── requirements.txt                   # Python dependencies
├── environment.yml                    # Conda environment (optional)
├── setup.py                          # Package installation (optional)
│
├── notebooks/                         # Jupyter notebooks
│   ├── 00_data_exploration.ipynb     # Initial data exploration
│   ├── 01_preprocessing.ipynb        # Data preprocessing
│   ├── 02_baseline_model.ipynb       # Baseline experiments
│   ├── 03_emulator_training.ipynb    # Main model training
│   ├── 04_evaluation.ipynb           # Model evaluation
│   └── 05_inference.ipynb            # Inference and predictions
│
├── src/                               # Source code package
│   ├── __init__.py
│   ├── data/                         # Data loading and processing
│   │   ├── __init__.py
│   │   ├── loaders.py               # Data loaders from OSN
│   │   ├── preprocessing.py         # Preprocessing functions
│   │   └── augmentation.py          # Data augmentation
│   │
│   ├── models/                       # Model architectures
│   │   ├── __init__.py
│   │   ├── emulator.py              # Main emulator model
│   │   ├── layers.py                # Custom layers
│   │   └── architectures.py         # Different architectures (CNN, Transformer, etc.)
│   │
│   ├── training/                     # Training utilities
│   │   ├── __init__.py
│   │   ├── trainer.py               # Training loops
│   │   ├── losses.py                # Custom loss functions
│   │   └── metrics.py               # Evaluation metrics
│   │
│   ├── utils/                        # Utility functions
│   │   ├── __init__.py
│   │   ├── osn_utils.py             # OSN data access helpers
│   │   ├── visualization.py         # Plotting functions
│   │   ├── checkpoints.py           # Checkpoint management
│   │   └── config.py                # Configuration management
│   │
│   └── evaluation/                   # Evaluation and analysis
│       ├── __init__.py
│       ├── evaluator.py             # Evaluation pipelines
│       └── metrics.py               # Performance metrics
│
├── scripts/                          # Standalone scripts
│   ├── train.py                     # Training script
│   ├── evaluate.py                  # Evaluation script
│   ├── preprocess_data.py           # Data preprocessing
│   └── download_data.py             # Download data from OSN
│
├── configs/                          # Configuration files
│   ├── base_config.yaml             # Base configuration
│   ├── model_configs/               # Model-specific configs
│   │   ├── cnn.yaml
│   │   ├── transformer.yaml
│   │   └── hybrid.yaml
│   └── experiment_configs/          # Experiment configs
│       ├── baseline.yaml
│       └── production.yaml
│
├── tests/                            # Unit tests
│   ├── __init__.py
│   ├── test_data.py
│   ├── test_models.py
│   └── test_training.py
│
├── docs/                             # Documentation
│   ├── setup.md                     # Setup instructions
│   ├── data.md                      # Data documentation
│   ├── models.md                    # Model documentation
│   └── workflows.md                 # Workflow guides
│
└── examples/                         # Example scripts and notebooks
    ├── quick_start.ipynb
    └── advanced_usage.ipynb
```

## Storage Guidelines

### ✅ Commit to Git (nycleap repo)
- Source code (`src/`, `scripts/`)
- Notebooks (clear output before committing)
- Configuration files (`configs/`)
- Documentation (`docs/`, markdown files)
- Small test data (< 1MB)
- Requirements and environment files
- `.gitignore` and repository metadata

### ⚠️ Store in `/home/jovyan/leap-scratch/<your-name>/`
- Intermediate data files
- Experiment outputs
- Model checkpoints during training
- Generated figures and plots
- Logs and debugging files
- Large downloaded datasets

### ☁️ Store on OSN Cloud Storage
- Training datasets (large)
- Processed datasets
- Final trained models
- Shared team artifacts
- Reproducible results

## Data Organization on leap-scratch

```
/home/jovyan/leap-scratch/<your-name>/
├── data/
│   ├── raw/                  # Raw downloaded data
│   ├── processed/            # Processed datasets
│   └── interim/              # Intermediate files
│
├── models/
│   ├── checkpoints/          # Training checkpoints
│   ├── final/                # Final trained models
│   └── experiments/          # Experimental models
│
├── outputs/
│   ├── figures/              # Generated figures
│   ├── predictions/          # Model predictions
│   └── metrics/              # Performance metrics
│
└── logs/                     # Training logs
```

## File Naming Conventions

### Models
- `emulator_v1_cnn_20260115.ckpt`
- `emulator_v2_transformer_best.ckpt`
- Format: `<model>_<version>_<architecture>_<date/tag>.ckpt`

### Notebooks
- Use numeric prefixes for order: `01_`, `02_`, etc.
- Use descriptive names: `03_train_baseline_model.ipynb`
- Clear outputs before committing

### Scripts
- Use lowercase with underscores: `train_model.py`
- Be descriptive: `preprocess_climate_data.py`

### Configs
- Use lowercase with underscores
- Include purpose: `train_config.yaml`, `eval_config.yaml`

## Version Control Best Practices

1. **Commit Often**: Small, focused commits
2. **Clear Messages**: Descriptive commit messages
3. **Branch Strategy**: Use feature branches
4. **Code Review**: Pull requests for major changes
5. **Clean Notebooks**: Clear outputs before committing
6. **No Secrets**: Never commit credentials or API keys
7. **Document**: Update README and docs with changes
