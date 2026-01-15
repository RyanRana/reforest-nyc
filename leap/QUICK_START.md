# Quick Start Guide

Get started with the NYC LEAP Climate Emulator in 5 minutes!

## 🚀 Super Quick Setup (For Experienced Users)

```bash
# 1. Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 2. Clone or initialize
cd /home/jovyan/
git clone https://github.com/RyanRana/nycleap.git
cd nycleap

# OR if you already have the files:
cd /home/jovyan/nycleap
git init
git remote add origin https://github.com/RyanRana/nycleap.git
git add .
git commit -m "Initial commit"
git push -u origin main

# 3. Run startup notebook
# Open leap_startup.ipynb and run all cells

# 4. Create scratch directory
mkdir -p /home/jovyan/leap-scratch/$USER

# 5. Start working
git checkout -b feature/my-feature
```

## 📋 Detailed Steps

### If Starting Fresh on JupyterHub

1. **Upload files to JupyterHub**
   - Upload all files to `/home/jovyan/nycleap/`

2. **Run setup script**
   ```bash
   cd /home/jovyan/nycleap
   chmod +x git_setup.sh
   ./git_setup.sh
   ```

3. **Run startup notebook**
   - Open `leap_startup.ipynb`
   - Run all cells

4. **Create scratch directory**
   ```bash
   mkdir -p /home/jovyan/leap-scratch/$USER
   ```

### If Cloning Existing Repo

1. **Clone the repository**
   ```bash
   cd /home/jovyan/
   git clone https://github.com/RyanRana/nycleap.git
   cd nycleap
   ```

2. **Run startup notebook**
   - Open `leap_startup.ipynb`
   - Run all cells

3. **Create scratch directory**
   ```bash
   mkdir -p /home/jovyan/leap-scratch/$USER
   ```

## 🎯 Your First Task

Create a simple data exploration notebook:

```bash
cd /home/jovyan/nycleap

# Create a feature branch
git checkout -b feature/data-exploration

# Create a new notebook in notebooks/ directory
# Name it: 00_data_exploration.ipynb

# Add some code to explore data from OSN
# Save and clear outputs

# Commit your work
git add notebooks/00_data_exploration.ipynb
git commit -m "Add initial data exploration notebook"
git push origin feature/data-exploration
```

## 📚 Essential Reading

- **README.md** - Project overview (5 min read)
- **GIT_WORKFLOW_JUPYTERLAB.md** - Git tips (10 min read)
- **PROJECT_STRUCTURE.md** - Where to put files (5 min read)

## 💡 Common Commands

```bash
# Check status
git status

# Pull latest changes
git pull origin main

# Create and switch to new branch
git checkout -b feature/my-feature

# Stage and commit
git add .
git commit -m "Descriptive message"

# Push to GitHub
git push origin feature/my-feature

# Switch branches
git checkout main
git checkout feature/other-feature

# See history
git log --oneline -10
```

## ⚠️ Important Reminders

1. **Never commit large files!**
   - Data files (*.nc, *.zarr, *.h5)
   - Model checkpoints (*.ckpt, *.pth)
   - Use `/leap-scratch/` instead

2. **Clear notebook outputs before committing**
   ```bash
   jupyter nbconvert --clear-output --inplace notebooks/*.ipynb
   ```

3. **Use feature branches**
   - Don't work directly on `main`
   - Create branches: `feature/my-feature`

4. **Pull before starting work**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/new-feature
   ```

## 🆘 Quick Troubleshooting

**Can't push to GitHub?**
```bash
# Use Personal Access Token as password
# Get one at: GitHub → Settings → Developer settings → Personal access tokens
```

**Merge conflict?**
```bash
# Open conflicting file, resolve manually
# Look for <<<<<<, =======, >>>>>> markers
git add resolved_file.py
git commit -m "Resolve conflict"
```

**Need to undo last commit?**
```bash
git reset --soft HEAD~1  # Keep changes
git reset --hard HEAD~1  # Discard changes (careful!)
```

**Accidentally committed large file?**
```bash
git rm --cached large_file.nc
git commit --amend -m "Remove large file"
```

## 🎉 You're Ready!

Start coding and have fun! For more details, check the full documentation.

Questions? Create a GitHub Issue or ask the team!
