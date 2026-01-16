# NYC LEAP Climate Emulator

Machine Learning Climate Emulator for Urban Futures - NYC LEAP Hackathon 2026

## 🌍 Project Overview

This project develops a machine learning emulator for climate modeling, specifically focused on urban climate futures. Using JAX/Flax, we're building fast, accurate neural network surrogates for climate simulations.

## 🚀 Quick Start

### On LEAP Pangeo JupyterHub

1. **Clone this repository**
   ```bash
   cd /home/jovyan/
   git clone https://github.com/RyanRana/nycleap.git
   cd nycleap
   ```

2. **Run the startup notebook**
   - Open `leap_startup.ipynb`
   - Run all cells to install dependencies and configure environment

3. **Set up your scratch directory**
   ```bash
   mkdir -p /home/jovyan/leap-scratch/$USER
   cd /home/jovyan/leap-scratch/$USER
   ln -s /home/jovyan/nycleap/notebooks notebooks
   ```

4. **Start exploring**
   - Check out notebooks in `notebooks/` directory
   - See `docs/` for detailed documentation

## 📁 Project Structure

```
nycleap/
├── notebooks/           # Jupyter notebooks for experiments
├── src/                # Source code package
│   ├── data/          # Data loading and preprocessing
│   ├── models/        # Model architectures
│   ├── training/      # Training utilities
│   └── utils/         # Helper functions
├── scripts/           # Standalone Python scripts
├── configs/           # Configuration files
├── tests/             # Unit tests
├── docs/              # Documentation
└── examples/          # Example usage
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed structure.

## 🛠️ Installation

### Required Packages

All required packages are installed via the startup notebook:

- **Core ML**: jax, jaxlib, flax, optax, orbax-checkpoint
- **Data Science**: numpy, pandas, xarray
- **Cloud Storage**: s3fs, fsspec, gcsfs
- **Visualization**: matplotlib, cartopy
- **ML Tools**: huggingface_hub

### Manual Installation (if needed)

```bash
pip install jax jaxlib flax optax orbax-checkpoint \
            xarray s3fs fsspec gcsfs \
            numpy pandas matplotlib cartopy \
            huggingface_hub
```

## 📊 Data Access

### OSN (Open Storage Network) Configuration

```python
OSN_ENDPOINT_URL = "https://ncsa.osn.xsede.org"
OSN_BUCKET = "Pangeo"
HACKATHON_PREFIX = "leap-persistent/hackathon-2024"
```

### Accessing Data

```python
import s3fs
import xarray as xr

# Initialize S3 filesystem
fs = s3fs.S3FileSystem(
    anon=True,
    client_kwargs={'endpoint_url': OSN_ENDPOINT_URL}
)

# Load dataset
ds = xr.open_zarr(fs.get_mapper('s3://Pangeo/leap-persistent/hackathon-2024/your-dataset.zarr'))
```

## 🔧 Development Workflow

### Git Workflow

See [GIT_WORKFLOW_JUPYTERLAB.md](GIT_WORKFLOW_JUPYTERLAB.md) for complete Git workflow guide.

**Quick reference:**

```bash
# Daily workflow
git pull origin main                    # Get latest changes
git checkout -b feature/your-feature    # Create feature branch
# ... make changes ...
git add .                               # Stage changes
git commit -m "Descriptive message"     # Commit
git push origin feature/your-feature    # Push to GitHub
```

### Best Practices

✅ **DO:**
- Store large data in `/home/jovyan/leap-scratch/$USER/`
- Read data directly from OSN using s3fs
- Clear notebook outputs before committing
- Write descriptive commit messages
- Create feature branches for new work
- Review teammates' code

❌ **DON'T:**
- Commit large data files or checkpoints
- Store data in home directory (limited to ~10GB)
- Commit notebooks with outputs
- Push directly to main without review

## 🧪 Running Experiments

### Using Notebooks

```bash
cd notebooks
jupyter lab  # Already running on JupyterHub
```

Start with:
1. `00_data_exploration.ipynb` - Explore available datasets
2. `01_preprocessing.ipynb` - Preprocess data
3. `02_baseline_model.ipynb` - Train baseline model
4. `03_emulator_training.ipynb` - Train climate emulator

### Using Scripts

```bash
# Preprocess data
python scripts/preprocess_data.py --config configs/base_config.yaml

# Train model
python scripts/train.py --config configs/model_configs/cnn.yaml

# Evaluate
python scripts/evaluate.py --checkpoint /leap-scratch/$USER/models/checkpoints/best.ckpt
```

## 🤝 Team Collaboration

### Git Configuration

```bash
# Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### GitHub Authentication

Use Personal Access Token for authentication:
1. GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate token with `repo` scope
3. Use token as password when pushing

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `experiment/*` - Experimental work

### Code Review Process

1. Create feature branch
2. Make changes and commit
3. Push to GitHub
4. Create Pull Request
5. Request review from teammate
6. Address feedback
7. Merge after approval

## 📚 Documentation

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Detailed project structure
- [GIT_WORKFLOW_JUPYTERLAB.md](GIT_WORKFLOW_JUPYTERLAB.md) - Git workflow guide
- `docs/` - Additional documentation

## 🎯 Project Goals

1. **Build Fast Emulator**: Neural network surrogate for climate models
2. **Urban Focus**: Specific attention to urban climate dynamics
3. **Production Ready**: Deployable, documented, tested code
4. **Team Collaboration**: Effective Git workflow and code review
5. **Reproducible Science**: Clear documentation and version control

## 📈 Current Status

- [x] Repository setup
- [x] Environment configuration
- [x] Git workflow documentation
- [ ] Data exploration (in progress)
- [ ] Baseline model
- [ ] Production emulator
- [ ] Evaluation framework
- [ ] Deployment pipeline

## 🏆 Team Members

<!-- Add your team members here -->
- Team Member 1 - Role
- Team Member 2 - Role
- Team Member 3 - Role

## 📝 License

[Add license information]

## 🙏 Acknowledgments

- LEAP Pangeo for computing resources
- NYC LEAP Hackathon organizers
- Open Storage Network (OSN) for data hosting
- 2i2c for JupyterHub infrastructure

## 📧 Contact

For questions or issues, please:
- Create a GitHub Issue
- Contact via team Slack/Discord
- Email: [team contact]

---

**Happy Hacking! 🚀**

*Last updated: January 2026*
