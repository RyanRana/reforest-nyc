# 🎉 NYC LEAP Climate Emulator - Complete Setup Guide

**Your repository is now fully configured for team collaboration!**

Repository: https://github.com/RyanRana/nycleap

---

## 📦 What's Been Created

### 1. Core Documentation (8 files)
- **README.md** - Project overview and quick start
- **SETUP.md** - Detailed setup instructions (10-15 min guide)
- **QUICK_START.md** - 5-minute quick reference
- **GIT_WORKFLOW_JUPYTERLAB.md** - Complete Git workflow guide
- **PROJECT_STRUCTURE.md** - Recommended directory layout
- **SETUP_SUMMARY.md** - Setup verification checklist
- **COMPLETE_SETUP_GUIDE.md** - This file!
- **LICENSE** - MIT License

### 2. Configuration Files (4 files)
- **.gitignore** - ML-optimized ignore rules (large files, checkpoints, etc.)
- **.gitattributes** - Git attributes for proper file handling
- **requirements.txt** - Python dependencies
- **git_setup.sh** - Automated setup script

### 3. Notebooks (3 files)
- **leap_startup.ipynb** - Environment setup and package installation
- **01_hackathon_data_access.ipynb** - OSN and Hugging Face data access
- **02_climsim_analysis.ipynb** - ClimSim dataset deep dive with visualizations

---

## 🚀 Getting Started (Choose Your Path)

### Path A: Clone Existing Repository (Recommended)

```bash
# 1. On LEAP JupyterHub, open a terminal
cd /home/jovyan/

# 2. Clone the repository
git clone https://github.com/RyanRana/nycleap.git
cd nycleap

# 3. Run startup notebook
# Open leap_startup.ipynb and run all cells

# 4. Create scratch directory
mkdir -p /home/jovyan/leap-scratch/$USER

# 5. Start working!
git checkout -b feature/my-first-feature
```

### Path B: Upload Files and Initialize

```bash
# 1. Upload all files to /home/jovyan/nycleap/

# 2. Run the automated setup script
cd /home/jovyan/nycleap
chmod +x git_setup.sh
./git_setup.sh

# 3. Follow prompts to configure Git and push to GitHub

# 4. Run startup notebook
# Open leap_startup.ipynb

# 5. Create scratch directory
mkdir -p /home/jovyan/leap-scratch/$USER
```

---

## 📊 Updated Data Configuration (NYC LEAP 2026)

### OSN Cloud Storage

```python
OSN_ENDPOINT_URL = "https://nyu1.osn.mghpcc.org"  # Updated!
OSN_BUCKET = "leap-pangeo-manual"
HACKATHON_PREFIX = "hackathon-2026"
```

**Available datasets:**
- `hrrr/` - High-Resolution Rapid Refresh weather data
- `era5_cds/nyc/` - ERA5 reanalysis for NYC region
- `corrdiff/` - CorrDiff generative model outputs

### Hugging Face ClimSim

```python
# Two versions available:
"LEAP/ClimSim_low-res"
"LEAP/ClimSim_low-res-expanded"
```

---

## 📓 Notebook Guide

### 1. leap_startup.ipynb ⭐ **Run This First!**

**Purpose:** One-click environment setup

**What it does:**
- ✅ Checks Python version
- ✅ Checks GPU availability (PyTorch & JAX)
- ✅ Installs all required packages
- ✅ Verifies imports with version numbers
- ✅ Sets OSN configuration constants
- ✅ Shows best practices

**Time:** 5-10 minutes (first run)

**When to run:** Every time you start on JupyterHub

### 2. 01_hackathon_data_access.ipynb

**Purpose:** Learn to access hackathon data

**What it covers:**
- Anonymous S3 filesystem setup for OSN
- Listing available datasets (hrrr, era5, corrdiff)
- Opening Zarr stores lazily with xarray
- Downloading ClimSim from Hugging Face
- Streaming mode for large datasets

**Time:** 15-20 minutes

**When to use:** Before starting data analysis

### 3. 02_climsim_analysis.ipynb 🌟 **New!**

**Purpose:** Deep dive into ClimSim dataset

**What it covers:**
1. **Load ClimSim** - Load first 1000 samples for analysis
2. **Inspect Structure** - Print shapes of inputs/outputs
3. **Variable Details** - All state_* and ptend_* variables explained
4. **Vertical Levels** - Atmospheric pressure levels (60 levels typical)
5. **Sample Statistics** - Mean/std/min/max for each variable
6. **Normalization Check** - Detect if data is pre-normalized
7. **Temperature Profile** - Visualize vertical temperature distribution
8. **Tendency Profile** - Visualize temperature tendency (target)
9. **Multi-Variable Comparison** - Side-by-side state vs tendency

**Visualizations included:**
- 📈 Vertical temperature profile with pressure levels
- 📊 Temperature tendency with warming/cooling regions
- 🎨 Multi-variable comparison plots

**Time:** 30 minutes

**When to use:** Before building your ML emulator

---

## 🔧 Installed Packages

The startup notebook installs:

### Core ML/AI
```
jax>=0.4.20
jaxlib>=0.4.20
flax>=0.7.5
optax>=0.1.7
orbax-checkpoint>=0.4.4
```

### Hugging Face
```
huggingface_hub>=0.19.0
datasets>=2.14.0         # NEW!
```

### Data Science
```
numpy>=1.24.0
pandas>=2.0.0
xarray>=2023.1.0
```

### Cloud Storage
```
s3fs>=2023.1.0
fsspec>=2023.1.0
gcsfs>=2023.1.0
```

### Visualization
```
matplotlib>=3.7.0
cartopy>=0.22.0
seaborn>=0.12.0
```

---

## 🎯 Typical Workflow

### Day 1: Setup
1. Clone repository
2. Run `leap_startup.ipynb`
3. Explore `01_hackathon_data_access.ipynb`
4. Run `02_climsim_analysis.ipynb`

### Day 2-3: Data Exploration
1. Load your specific datasets from OSN
2. Download ClimSim subsample
3. Explore data distributions
4. Create preprocessing pipeline

### Day 4-7: Model Development
1. Design baseline model
2. Train initial emulator
3. Evaluate performance
4. Iterate and improve

### Day 8-10: Production & Presentation
1. Train final model
2. Generate results and visualizations
3. Prepare presentation
4. Document findings

---

## 🔍 ClimSim Dataset Details

### What is ClimSim?

ClimSim is a machine learning dataset for training climate physics emulators. It contains:

**Inputs (State Variables):**
- `state_t` - Temperature [K] at 60 vertical levels
- `state_q0001` - Specific humidity [kg/kg]
- `state_q0002` - Cloud liquid water [kg/kg]
- `state_q0003` - Cloud ice [kg/kg]
- `state_u` - Zonal wind [m/s]
- `state_v` - Meridional wind [m/s]
- `state_ps` - Surface pressure [Pa]

**Outputs (Tendencies):**
- `ptend_t` - Temperature tendency [K/s]
- `ptend_q0001` - Humidity tendency [kg/kg/s]
- `ptend_q0002` - Cloud liquid tendency [kg/kg/s]
- `ptend_q0003` - Cloud ice tendency [kg/kg/s]
- `ptend_u` - Wind tendency [m/s²]
- `ptend_v` - Wind tendency [m/s²]

### ML Task

**Goal:** Predict physical tendencies from atmospheric state

```
Input:  state_t, state_q, state_u, state_v, ... 
        (current atmospheric conditions)
        ↓
Model:  Neural Network (MLP, CNN, Transformer)
        ↓
Output: ptend_t, ptend_q, ptend_u, ptend_v, ...
        (how conditions change over time)
```

**Why this matters:** Climate models spend 90%+ of compute time on physics. ML emulators can be 100-1000x faster!

---

## 💾 Storage Guidelines

### ❌ Do NOT Store Here (Home Directory - 10GB limit)
```
/home/jovyan/
```
- Large data files
- Model checkpoints
- Generated outputs

### ✅ Store Here (Leap Scratch - Large)
```
/home/jovyan/leap-scratch/$USER/
├── data/
├── models/
├── outputs/
└── logs/
```

### ☁️ Read From Here (OSN Cloud)
```
s3://leap-pangeo-manual/hackathon-2026/
├── hrrr/
├── era5_cds/nyc/
└── corrdiff/
```

---

## 🤝 Git Collaboration

### Daily Workflow

```bash
# Morning
git pull origin main
git checkout -b feature/experiment-name

# Work
# ... edit files, run experiments ...

# Save progress
git add .
git commit -m "Add temperature emulator baseline"

# Evening
git push origin feature/experiment-name

# Create Pull Request on GitHub for review
```

### Branch Naming

- `feature/new-feature` - New features
- `experiment/test-idea` - Experimental work
- `fix/bug-description` - Bug fixes
- `docs/update-readme` - Documentation

### Before Committing

```bash
# Clear notebook outputs
jupyter nbconvert --clear-output --inplace notebooks/*.ipynb

# Check what's staged
git status
git diff --cached

# Commit
git commit -m "Clear, descriptive message"
```

---

## ⚠️ Critical Best Practices

### ✅ DO
1. **Store large files in leap-scratch:** `/home/jovyan/leap-scratch/$USER/`
2. **Read from OSN directly:** Use s3fs for lazy loading
3. **Clear notebook outputs:** Before every commit
4. **Use feature branches:** Never commit directly to main
5. **Pull before push:** Always get latest changes first
6. **Write good commit messages:** "Add CNN baseline model" not "update"
7. **Review teammates' code:** Learn from each other

### ❌ DON'T
1. **Commit large data files:** *.nc, *.zarr, *.h5 (use .gitignore)
2. **Commit model checkpoints:** *.ckpt, *.pth (use .gitignore)
3. **Store in home directory:** Limited to ~10GB
4. **Work on main:** Use branches
5. **Force push to main:** Ever!
6. **Skip code review:** PRs help catch issues
7. **Commit secrets:** API keys, passwords

---

## 🐛 Common Issues & Solutions

### Issue: "No space left on device"

**Solution:**
```bash
# Check usage
du -sh /home/jovyan/*

# Clean cache
rm -rf ~/.cache/*

# Move large files to leap-scratch
mv large_data.nc /home/jovyan/leap-scratch/$USER/data/
```

### Issue: "Permission denied" when pushing

**Solution:**
1. Generate Personal Access Token on GitHub
2. Use token as password when pushing
3. Store credentials: `git config --global credential.helper store`

### Issue: Package import fails after installation

**Solution:**
```python
# Restart kernel in Jupyter
# Kernel → Restart Kernel
# Then re-run imports
```

### Issue: Merge conflict

**Solution:**
```bash
git status  # See conflicted files

# Open file, resolve conflicts (remove <<<<<<, =======, >>>>>> markers)

git add resolved_file.py
git commit -m "Resolve merge conflict"
```

---

## 📚 Documentation Quick Links

### In This Repository
- [README.md](README.md) - Start here
- [SETUP.md](SETUP.md) - Detailed setup (15 min)
- [QUICK_START.md](QUICK_START.md) - Quick commands (5 min)
- [GIT_WORKFLOW_JUPYTERLAB.md](GIT_WORKFLOW_JUPYTERLAB.md) - Git tutorial
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Where to put files

### External Links
- **GitHub Repo:** https://github.com/RyanRana/nycleap
- **LEAP JupyterHub:** https://leap.2i2c.cloud/
- **OSN Endpoint:** https://nyu1.osn.mghpcc.org
- **ClimSim (HF):** https://huggingface.co/datasets/LEAP/ClimSim_low-res

---

## ✅ Setup Verification Checklist

Before you start working, check:

- [ ] Git configured with name/email: `git config --list`
- [ ] Repository cloned: `cd /home/jovyan/nycleap && ls`
- [ ] Can push to GitHub (test with empty commit)
- [ ] Startup notebook runs: All packages show ✅
- [ ] Scratch directory created: `ls /home/jovyan/leap-scratch/$USER`
- [ ] Can list OSN data: Run cell in data access notebook
- [ ] JupyterLab Git extension visible in left sidebar
- [ ] Understand branch workflow: Read Git guide
- [ ] Know where to store files: Read project structure

---

## 🎓 Learning Resources

### Git & GitHub
- [Git Basics](https://git-scm.com/book/en/v2)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- Our guide: [GIT_WORKFLOW_JUPYTERLAB.md](GIT_WORKFLOW_JUPYTERLAB.md)

### JAX & Flax
- [JAX Documentation](https://jax.readthedocs.io/)
- [Flax Documentation](https://flax.readthedocs.io/)
- [JAX Tutorial](https://jax.readthedocs.io/en/latest/notebooks/quickstart.html)

### Climate Data
- [Xarray Tutorial](https://tutorial.xarray.dev/)
- [ClimSim Paper](https://huggingface.co/datasets/LEAP/ClimSim_low-res)
- Our notebooks: `01_hackathon_data_access.ipynb`, `02_climsim_analysis.ipynb`

---

## 🆘 Getting Help

### Within Team
1. Create GitHub Issue
2. Ask in team Slack/Discord
3. Schedule pair programming session
4. Review docs in repository

### From Organizers
1. Check hackathon Slack
2. Attend office hours
3. Ask in hackathon Discord
4. Email organizers

### Community
1. Stack Overflow (JAX, Python questions)
2. GitHub Discussions (for libraries)
3. Hugging Face Forums (dataset questions)

---

## 🎯 Next Actions

### Right Now (5 minutes)
1. ✅ Read this file (you're doing it!)
2. ✅ Clone or set up repository
3. ✅ Run `leap_startup.ipynb`

### Today (30 minutes)
1. Explore `01_hackathon_data_access.ipynb`
2. Run `02_climsim_analysis.ipynb`
3. Create your first feature branch
4. Make a test commit

### This Week
1. Load and explore HRRR or ERA5 data
2. Download ClimSim subsample
3. Create preprocessing pipeline
4. Build baseline model

### Full Hackathon
1. Develop climate emulator
2. Train and evaluate
3. Create visualizations
4. Document and present

---

## 🌟 Project Goals

### Technical Goals
- **Build fast ML emulator** for climate physics
- **Train on ClimSim** low-res dataset
- **Deploy** working model
- **Document** approach and results

### Learning Goals
- Master JAX/Flax for ML
- Understand climate data structures
- Practice team Git workflow
- Present technical work

### Team Goals
- Collaborate effectively
- Share knowledge
- Support each other
- Have fun! 🎉

---

## 📞 Contact & Support

### Repository Issues
- Create issue on: https://github.com/RyanRana/nycleap/issues

### Team Communication
- Team Slack/Discord (set up your channel!)
- Weekly sync meetings
- Code review sessions

### Hackathon Support
- LEAP hackathon organizers
- 2i2c JupyterHub support
- OSN data support

---

## 🎉 You're All Set!

Everything is ready for successful collaboration on the NYC LEAP Climate Emulator project!

**Key Takeaways:**
- ✅ Complete Git workflow configured
- ✅ Data access to OSN and Hugging Face
- ✅ ClimSim analysis notebook ready
- ✅ Best practices documented
- ✅ Team collaboration enabled

**Now go build something amazing! 🚀🌍**

---

*Last Updated: January 15, 2026*
*NYC LEAP Hackathon 2026*
*Repository: https://github.com/RyanRana/nycleap*

**Happy Hacking! 🎊**
