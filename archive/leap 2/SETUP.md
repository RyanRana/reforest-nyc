# Setup Guide for NYC LEAP Climate Emulator

Complete setup instructions for the LEAP Pangeo JupyterHub environment.

## 🎯 Overview

This guide walks you through:
1. Initial Git configuration
2. Cloning the repository
3. Setting up your workspace
4. Installing dependencies
5. Configuring data access
6. Running your first experiment

**Estimated time**: 10-15 minutes

---

## 📋 Prerequisites

- Access to LEAP Pangeo JupyterHub ([https://leap.2i2c.cloud/](https://leap.2i2c.cloud/))
- GitHub account
- Basic familiarity with Git and Python

---

## 🚀 Step-by-Step Setup

### Step 1: Access JupyterHub

1. Navigate to [https://leap.2i2c.cloud/](https://leap.2i2c.cloud/)
2. Log in with your credentials
3. Select image: **Default (1 CPU / 8 GB RAM)** or **GPU** if needed
4. Wait for server to start

### Step 2: Configure Git

Open a terminal in JupyterLab (File → New → Terminal) and run:

```bash
# Set your identity
git config --global user.name "Your Full Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.cm commit
git config --global alias.br branch

# Better diffs
git config --global merge.conflictstyle diff3

# Verify configuration
git config --list
```

### Step 3: Set Up GitHub Authentication

**Option A: Personal Access Token (Recommended)**

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "LEAP JupyterHub"
4. Select scopes: `repo` (all sub-scopes)
5. Click "Generate token"
6. **COPY THE TOKEN NOW** (you won't see it again!)

```bash
# Store credentials so you don't have to enter token repeatedly
git config --global credential.helper store
```

When you push for the first time, use:
- Username: your GitHub username
- Password: paste the token

**Option B: SSH Keys**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or create one for security)

# Display public key
cat ~/.ssh/id_ed25519.pub
```

Copy the output and add to GitHub:
- GitHub.com → Settings → SSH and GPG keys → New SSH key
- Paste your public key

### Step 4: Clone the Repository

**Using Terminal:**

```bash
# Navigate to home directory
cd /home/jovyan/

# Clone repository (HTTPS)
git clone https://github.com/RyanRana/nycleap.git

# OR clone with SSH (if you set up SSH keys)
git clone git@github.com:RyanRana/nycleap.git

# Enter the repository
cd nycleap

# Verify
git status
git remote -v
```

**Using JupyterLab Git Extension:**

1. Click the Git icon in left sidebar
2. Click "Clone a Repository"
3. Enter: `https://github.com/RyanRana/nycleap`
4. Click "Clone"

### Step 5: Run Startup Notebook

```bash
cd /home/jovyan/nycleap
```

1. Open `leap_startup.ipynb` in JupyterLab
2. Run all cells (Shift + Enter or Run → Run All Cells)
3. Wait for package installation (~5-10 minutes first time)
4. Verify all packages show ✅ in the output

This will:
- Check Python version and GPU availability
- Install all required packages
- Verify imports
- Configure OSN access
- Display best practices

### Step 6: Create Your Scratch Directory

Large files and outputs go here, NOT in your home directory!

```bash
# Create your personal scratch directory
mkdir -p /home/jovyan/leap-scratch/$USER

# Set up subdirectories
cd /home/jovyan/leap-scratch/$USER
mkdir -p data/raw data/processed data/interim
mkdir -p models/checkpoints models/final models/experiments
mkdir -p outputs/figures outputs/predictions outputs/metrics
mkdir -p logs

# Create symlink for easy access from notebooks
cd /home/jovyan/nycleap
ln -s /home/jovyan/leap-scratch/$USER scratch

# Verify
ls -la
```

### Step 7: Test Data Access

Create a test notebook to verify OSN access:

```python
import s3fs
import xarray as xr

# OSN configuration (from startup notebook)
OSN_ENDPOINT_URL = "https://ncsa.osn.xsede.org"
OSN_BUCKET = "Pangeo"
HACKATHON_PREFIX = "leap-persistent/hackathon-2024"

# Initialize S3 filesystem
fs = s3fs.S3FileSystem(
    anon=True,
    client_kwargs={'endpoint_url': OSN_ENDPOINT_URL}
)

# List available data
try:
    files = fs.ls(f"{OSN_BUCKET}/{HACKATHON_PREFIX}")
    print(f"✅ Successfully connected to OSN!")
    print(f"Found {len(files)} files/directories")
    for f in files[:5]:
        print(f"  - {f}")
except Exception as e:
    print(f"❌ Error accessing OSN: {e}")
```

### Step 8: Create Your First Branch

Always work on branches, not directly on main!

```bash
cd /home/jovyan/nycleap

# Create and switch to a new branch
git checkout -b feature/initial-setup

# Verify you're on the new branch
git branch
```

### Step 9: Make Your First Commit

```bash
# Create a simple test file
echo "# My Notes\n\nStarted project on $(date)" > notes.md

# Check status
git status

# Stage the file
git add notes.md

# Commit
git commit -m "Add initial notes file"

# Push to GitHub
git push origin feature/initial-setup
```

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Git is configured with your name and email
- [ ] Repository is cloned to `/home/jovyan/nycleap`
- [ ] Startup notebook runs without errors
- [ ] All packages show ✅ in import verification
- [ ] Scratch directory exists at `/home/jovyan/leap-scratch/$USER`
- [ ] Can list files on OSN
- [ ] Can create branches and commits
- [ ] Can push to GitHub

---

## 🎓 Next Steps

### 1. Explore the Notebooks

```bash
cd /home/jovyan/nycleap/notebooks
```

Start with:
- `00_data_exploration.ipynb` - Explore available data
- `01_preprocessing.ipynb` - Data preprocessing pipeline

### 2. Read the Documentation

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Project organization
- [GIT_WORKFLOW_JUPYTERLAB.md](GIT_WORKFLOW_JUPYTERLAB.md) - Git workflow
- `docs/` directory - Additional guides

### 3. Set Up Your Development Environment

**Install development tools:**

```bash
pip install black isort flake8 mypy nbstripout
```

**Configure notebook output stripping:**

```bash
cd /home/jovyan/nycleap
nbstripout --install
```

Now notebooks will automatically have outputs cleared before committing!

### 4. Join Team Communication

- Team Slack/Discord channel
- GitHub repository watch (for notifications)
- Schedule regular team sync meetings

---

## 🔧 Configuration Files

### Create `.env` file (for secrets)

```bash
cd /home/jovyan/nycleap
nano .env
```

Add (example):
```bash
# API Keys (never commit this file!)
WANDB_API_KEY=your_key_here
HF_TOKEN=your_token_here

# User settings
USER_NAME=your_name
SCRATCH_DIR=/home/jovyan/leap-scratch/$USER
```

⚠️ **Never commit `.env` file!** (already in `.gitignore`)

### Create personal config

```bash
mkdir -p configs/personal
cp configs/base_config.yaml configs/personal/my_config.yaml
# Edit my_config.yaml with your settings
```

---

## 🐛 Troubleshooting

### Git Authentication Issues

**Problem**: "Permission denied" when pushing

**Solution**:
```bash
# For HTTPS: Use personal access token as password
# For SSH: Verify SSH key is added to GitHub
ssh -T git@github.com  # Test SSH connection
```

### Package Installation Fails

**Problem**: pip install errors

**Solution**:
```bash
# Update pip
pip install --upgrade pip

# Install packages one by one to identify issue
pip install jax
pip install flax
# etc.
```

### OSN Access Issues

**Problem**: Can't connect to OSN

**Solution**:
```python
# Verify endpoint URL is correct
# Try with verbose error messages
import s3fs
fs = s3fs.S3FileSystem(anon=True, 
                       client_kwargs={'endpoint_url': 'https://ncsa.osn.xsede.org'})
print(fs.ls('Pangeo'))  # Test connection
```

### Space Issues

**Problem**: "No space left on device"

**Solution**:
```bash
# Check usage
du -sh /home/jovyan/*
du -sh /home/jovyan/leap-scratch/$USER/*

# Clean up
rm -rf /home/jovyan/.cache/*
# Move large files to leap-scratch
```

### Git Merge Conflicts

**Problem**: Conflict when pulling changes

**Solution**:
```bash
# See conflicted files
git status

# Open file and resolve conflicts manually
# (look for <<<<<<, =======, >>>>>> markers)

# After resolving:
git add resolved_file.py
git commit -m "Resolve merge conflict"
```

---

## 📚 Additional Resources

- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [JupyterLab Documentation](https://jupyterlab.readthedocs.io/)
- [JAX Documentation](https://jax.readthedocs.io/)
- [Flax Documentation](https://flax.readthedocs.io/)
- [Xarray Tutorial](https://tutorial.xarray.dev/)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check documentation**: README.md, GIT_WORKFLOW_JUPYTERLAB.md
2. **Search GitHub Issues**: Check if someone else had the same problem
3. **Ask the team**: Slack/Discord channel
4. **Create an issue**: GitHub Issues with detailed description
5. **Contact organizers**: LEAP hackathon support

---

## ✨ Tips for Success

1. **Commit often**: Small, focused commits are better
2. **Pull before push**: Always pull latest changes first
3. **Use branches**: Keep main branch stable
4. **Clear outputs**: Strip notebook outputs before committing
5. **Document**: Write README files and comments
6. **Communicate**: Keep team updated on progress
7. **Backup**: Push to GitHub frequently
8. **Ask questions**: No question is too simple!

---

**You're all set! Happy coding! 🎉**

If you have questions, don't hesitate to ask the team or create a GitHub issue.
