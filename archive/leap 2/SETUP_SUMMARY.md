# NYC LEAP Climate Emulator - Setup Summary

## 🎉 What We've Created

Complete Git workflow and project structure for the NYC LEAP Hackathon 2026 ML Climate Emulator project!

### 📁 Repository Structure

```
nycleap/
├── 📘 Documentation
│   ├── README.md                        # Project overview
│   ├── SETUP.md                         # Detailed setup guide
│   ├── QUICK_START.md                   # Quick reference
│   ├── GIT_WORKFLOW_JUPYTERLAB.md      # Git workflow guide
│   ├── PROJECT_STRUCTURE.md             # Project organization
│   └── SETUP_SUMMARY.md                 # This file
│
├── ⚙️ Configuration
│   ├── .gitignore                       # Git ignore rules (ML-optimized)
│   ├── .gitattributes                   # Git attributes
│   ├── requirements.txt                 # Python dependencies
│   ├── LICENSE                          # MIT License
│   └── git_setup.sh                     # Automated setup script
│
├── 📓 Notebooks
│   ├── leap_startup.ipynb               # Environment setup notebook
│   ├── 00_example_data_access.ipynb     # Example data loading
│   └── 01_hackathon_data_access.ipynb   # Hackathon data guide
│
└── 🔮 Future Structure (to be created)
    ├── src/                             # Source code package
    ├── scripts/                         # Standalone scripts
    ├── configs/                         # Configuration files
    ├── tests/                           # Unit tests
    ├── docs/                            # Additional documentation
    └── examples/                        # Example scripts
```

---

## 🚀 Quick Start Guide

### For New Team Members

1. **Clone the repository**
   ```bash
   cd /home/jovyan/
   git clone https://github.com/RyanRana/nycleap.git
   cd nycleap
   ```

2. **Run startup notebook**
   - Open `leap_startup.ipynb`
   - Run all cells
   - Verify all packages show ✅

3. **Create your scratch directory**
   ```bash
   mkdir -p /home/jovyan/leap-scratch/$USER
   ```

4. **Start working on a feature**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### For Project Setup from Scratch

If you're uploading these files to a fresh JupyterHub:

```bash
cd /home/jovyan/nycleap
chmod +x git_setup.sh
./git_setup.sh
```

This script will:
- Configure Git with your identity
- Initialize the repository
- Add remote to GitHub
- Create project structure
- Make initial commit
- Push to GitHub

---

## 📊 Data Access Configuration

### OSN Cloud Storage (Updated for 2026)

```python
OSN_ENDPOINT_URL = "https://nyu1.osn.mghpcc.org"
OSN_BUCKET = "leap-pangeo-manual"
HACKATHON_PREFIX = "hackathon-2026"
```

**Available datasets:**
- `hrrr/` - High-Resolution Rapid Refresh
- `era5_cds/nyc/` - ERA5 reanalysis for NYC
- `corrdiff/` - CorrDiff model outputs

### Hugging Face Datasets

- `LEAP/ClimSim_low-res`
- `LEAP/ClimSim_low-res-expanded`

---

## 📦 Installed Packages

The startup notebook installs:

**Core ML/AI:**
- jax, jaxlib, flax, optax, orbax-checkpoint
- datasets (Hugging Face)
- huggingface_hub

**Data Science:**
- numpy, pandas, xarray

**Cloud Storage:**
- s3fs, fsspec, gcsfs

**Visualization:**
- matplotlib, cartopy

---

## 🔧 Git Workflow

### Daily Workflow

```bash
# Morning: Get latest changes
git pull origin main

# Create feature branch
git checkout -b feature/experiment-name

# Work and commit regularly
git add .
git commit -m "Descriptive message"

# Push to GitHub
git push origin feature/experiment-name

# Create Pull Request on GitHub for review
```

### JupyterLab Git Extension

- **Git icon** in left sidebar provides GUI
- **Stage files**: Click + button
- **Commit**: Enter message and click Commit
- **Push/Pull**: Click upload/download icons
- **View history**: See all commits and changes

---

## ⚠️ Important Best Practices

### ✅ DO:
- Store large data in `/home/jovyan/leap-scratch/$USER/`
- Read data directly from OSN with s3fs
- Clear notebook outputs before committing
- Use feature branches for new work
- Write descriptive commit messages
- Review teammates' code

### ❌ DON'T:
- Commit large data files (*.nc, *.zarr, *.h5)
- Commit model checkpoints (*.ckpt, *.pth)
- Store data in home directory (limited to ~10GB)
- Work directly on main branch
- Push without pulling latest changes first

---

## 📚 Documentation Overview

### [README.md](README.md)
- Project overview
- Quick start guide
- Installation instructions
- Team information

### [SETUP.md](SETUP.md)
- Step-by-step setup instructions
- Git configuration
- GitHub authentication
- Troubleshooting

### [GIT_WORKFLOW_JUPYTERLAB.md](GIT_WORKFLOW_JUPYTERLAB.md)
- Complete Git workflow guide
- JupyterLab Git extension tutorial
- Collaboration tips
- Conflict resolution
- Quick reference card

### [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Recommended directory layout
- File naming conventions
- Storage guidelines
- Version control best practices

### [QUICK_START.md](QUICK_START.md)
- Super quick setup (5 minutes)
- Common commands
- Quick troubleshooting

---

## 🎓 Notebook Guides

### [leap_startup.ipynb](leap_startup.ipynb)
**Purpose:** Environment setup and package installation

**What it does:**
1. Checks Python version and GPU availability
2. Installs all required packages
3. Verifies imports
4. Configures OSN constants
5. Shows best practices

**When to run:** First thing when starting on JupyterHub

### [01_hackathon_data_access.ipynb](notebooks/01_hackathon_data_access.ipynb)
**Purpose:** Learn to access hackathon data

**What it covers:**
1. OSN anonymous S3 filesystem setup
2. Listing available datasets (hrrr, era5, corrdiff)
3. Opening Zarr stores lazily with xarray
4. Downloading ClimSim from Hugging Face
5. Streaming large datasets

**When to use:** After running startup notebook, before starting analysis

---

## 🤝 Team Collaboration

### Branch Strategy

```
main
  ├── feature/data-preprocessing
  ├── feature/baseline-model
  ├── feature/cnn-emulator
  ├── experiment/transformer-arch
  └── fix/preprocessing-bug
```

**Branch naming conventions:**
- `feature/*` - New features
- `experiment/*` - Experimental work
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Pull Request Workflow

1. Create feature branch
2. Make changes and commit
3. Push to GitHub
4. Create Pull Request
5. Request review from teammate
6. Address feedback
7. Merge after approval
8. Delete feature branch

### Code Review Checklist

- [ ] Code is well-documented
- [ ] No large files committed
- [ ] Notebook outputs are cleared
- [ ] Tests pass (if applicable)
- [ ] Follows project structure
- [ ] Descriptive commit messages

---

## 🗂️ Storage Organization

### Home Directory (~10GB limit)
```
/home/jovyan/
└── nycleap/              # Git repository only
    ├── notebooks/
    ├── src/
    └── docs/
```

### Leap Scratch (Large storage)
```
/home/jovyan/leap-scratch/$USER/
├── data/
│   ├── raw/              # Downloaded data
│   ├── processed/        # Processed datasets
│   └── interim/          # Intermediate files
├── models/
│   ├── checkpoints/      # Training checkpoints
│   └── final/            # Final trained models
├── outputs/
│   ├── figures/          # Generated figures
│   └── predictions/      # Model predictions
└── logs/                 # Training logs
```

### OSN Cloud (Shared team data)
```
s3://leap-pangeo-manual/hackathon-2026/
├── hrrr/                 # HRRR weather data
├── era5_cds/nyc/         # ERA5 reanalysis
└── corrdiff/             # CorrDiff outputs
```

---

## 🔍 Quick Reference

### Essential Git Commands

```bash
# Status and info
git status                    # Check what changed
git log --oneline -10        # Recent commits
git diff                     # See changes

# Daily workflow
git pull origin main         # Get latest
git checkout -b feature/name # New branch
git add .                    # Stage all
git commit -m "message"      # Commit
git push origin feature/name # Push

# Branch management
git branch                   # List branches
git checkout main            # Switch to main
git merge feature/name       # Merge branch

# Undo operations
git checkout -- file.py      # Discard changes
git reset HEAD file.py       # Unstage file
```

### Essential Python Commands

```python
# OSN data access
import s3fs
fs = s3fs.S3FileSystem(anon=True, 
                       client_kwargs={'endpoint_url': 'https://nyu1.osn.mghpcc.org'})
fs.ls('leap-pangeo-manual/hackathon-2026/')

# Load Zarr lazily
import xarray as xr
ds = xr.open_zarr(fs.get_mapper('s3://leap-pangeo-manual/hackathon-2026/hrrr/file.zarr'))

# ClimSim from Hugging Face
from datasets import load_dataset
dataset = load_dataset('LEAP/ClimSim_low-res', split='train', streaming=True)
```

---

## 🐛 Common Issues & Solutions

### "Permission denied" when pushing

**Solution:** Use Personal Access Token
1. GitHub → Settings → Developer settings → Tokens
2. Generate token with `repo` scope
3. Use token as password when pushing

### Large file committed accidentally

**Solution:** Remove before pushing
```bash
git rm --cached large_file.nc
git commit --amend -m "Remove large file"
```

### Merge conflict

**Solution:** Resolve manually
```bash
git status                    # See conflicted files
# Edit file to resolve conflicts
git add resolved_file.py
git commit -m "Resolve conflict"
```

### Out of space in home directory

**Solution:** Move to scratch
```bash
# Check usage
du -sh /home/jovyan/*
# Move large files
mv large_data.nc /home/jovyan/leap-scratch/$USER/data/
```

---

## 📞 Getting Help

### Resources

1. **Documentation** - README.md, SETUP.md, etc.
2. **GitHub Issues** - Create issue for problems
3. **Team communication** - Slack/Discord
4. **Office hours** - Ask hackathon organizers

### Useful Links

- **GitHub Repo:** https://github.com/RyanRana/nycleap
- **LEAP JupyterHub:** https://leap.2i2c.cloud/
- **OSN Endpoint:** https://nyu1.osn.mghpcc.org
- **ClimSim (HF):** https://huggingface.co/datasets/LEAP/ClimSim_low-res

---

## ✅ Setup Verification Checklist

Before starting your work, verify:

- [ ] Git is configured with your name/email
- [ ] Repository is cloned or initialized
- [ ] Can push to GitHub (authentication works)
- [ ] Startup notebook runs without errors
- [ ] All packages show ✅ in import verification
- [ ] Scratch directory created
- [ ] Can list OSN data with s3fs
- [ ] Can create and push branches
- [ ] Understand the project structure
- [ ] Read Git workflow documentation

---

## 🎯 Next Steps

### Immediate (Today)

1. ✅ Complete setup verification
2. ✅ Run startup notebook
3. ✅ Explore data access notebook
4. Create your first feature branch
5. Start data exploration

### Short-term (This Week)

1. Explore HRRR and ERA5 data
2. Download ClimSim subsample
3. Create preprocessing pipeline
4. Build baseline model
5. Set up experiment tracking

### Long-term (Hackathon)

1. Develop climate emulator
2. Train and evaluate models
3. Create visualizations
4. Document results
5. Prepare final presentation

---

## 🎉 You're Ready to Go!

Everything is set up for successful team collaboration on the NYC LEAP Climate Emulator project!

**Key takeaways:**
- Use Git for version control
- Store data in leap-scratch, not home
- Collaborate via branches and pull requests
- Clear notebook outputs before committing
- Ask for help when needed

**Happy hacking! 🚀**

---

*Last updated: January 15, 2026*
*Project: NYC LEAP Climate Emulator*
*GitHub: https://github.com/RyanRana/nycleap*
