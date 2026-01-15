# Git Workflow in LEAP Pangeo JupyterHub

Complete guide for using Git in JupyterLab for team collaboration on the NYC LEAP Climate Emulator project.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [JupyterLab Git Extension](#jupyterlab-git-extension)
3. [Daily Workflow](#daily-workflow)
4. [Collaboration Tips](#collaboration-tips)
5. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Configure Git (First Time Only)

Open a terminal in JupyterLab and run:

```bash
# Set your identity (use your actual name and email)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Useful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit

# Better diff and merge
git config --global merge.conflictstyle diff3
git config --global pull.rebase false
```

### 2. Clone the Team Repository

**Option A: Using JupyterLab Git Extension (Recommended)**

1. Click the **Git icon** in the left sidebar (looks like a branching diagram)
2. Click **Clone a Repository**
3. Enter repository URL: `https://github.com/RyanRana/nycleap`
4. Choose location (default: `/home/jovyan/`)
5. Click **Clone**

**Option B: Using Terminal**

```bash
cd /home/jovyan/
git clone https://github.com/RyanRana/nycleap.git
cd nycleap
```

### 3. Set Up GitHub Authentication

For pushing changes, you need authentication:

**Option A: Personal Access Token (Recommended for JupyterHub)**

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token (you won't see it again!)
4. When pushing, use token as password

**Option B: SSH Keys**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Add this key to GitHub:
# GitHub.com → Settings → SSH and GPG keys → New SSH key
```

Then clone with SSH:
```bash
git clone git@github.com:RyanRana/nycleap.git
```

### 4. Create Initial Project Structure

```bash
cd nycleap

# Create directory structure
mkdir -p notebooks src/{data,models,training,utils,evaluation} scripts configs tests docs examples

# Create __init__.py files
touch src/__init__.py src/data/__init__.py src/models/__init__.py
touch src/training/__init__.py src/utils/__init__.py src/evaluation/__init__.py

# Copy the .gitignore and other setup files
# (These should already be in your repo)
```

---

## JupyterLab Git Extension

The Git extension provides a graphical interface for Git operations.

### Accessing the Git Extension

1. **Open Git Panel**: Click the Git icon in the left sidebar
2. **Current Repository**: Shows current branch and changes
3. **Four Main Sections**:
   - **Changes**: Unstaged files
   - **Staged**: Files ready to commit
   - **History**: Commit history
   - **Remote**: Remote repository info

### Git Panel Layout

```
┌─────────────────────────────────┐
│  Current Repository             │
│  Branch: main ▼                 │
├─────────────────────────────────┤
│  🔄 Pull  ⬆️ Push               │
├─────────────────────────────────┤
│  Changes (3)                    │
│    ☐ notebook.ipynb      [+]   │
│    ☐ src/model.py        [+]   │
│    ☐ README.md           [+]   │
├─────────────────────────────────┤
│  Staged (0)                     │
├─────────────────────────────────┤
│  Commit Message:                │
│  [_________________________]    │
│           [Commit]              │
└─────────────────────────────────┘
```

### Key Features

#### 1. Stage/Unstage Files
- **Stage**: Click **+** next to a file or "Stage All"
- **Unstage**: Click **-** next to a staged file
- **Discard Changes**: Right-click → Discard changes (⚠️ careful!)

#### 2. Commit Changes
1. Stage files you want to commit
2. Enter commit message in text box
3. Click **Commit** button
4. **Best Practice**: Write clear, descriptive messages

#### 3. Pull/Push
- **Pull**: Click **Pull** (download icon) to get latest changes
- **Push**: Click **Push** (upload icon) to upload your commits

#### 4. Branch Management
- **View Branches**: Click branch dropdown
- **Create Branch**: Click **+** next to branch name
- **Switch Branch**: Click on branch name
- **Merge Branch**: Right-click → Merge into current branch

#### 5. View History
- Click **History** tab to see commit log
- Click on commit to see changes
- **Diff View**: See what changed in each file

---

## Daily Workflow

### Morning: Start Your Work Session

```bash
# Terminal approach
cd /home/jovyan/nycleap

# 1. Check current status
git status

# 2. Pull latest changes from team
git pull origin main

# 3. Create a new branch for your work (optional but recommended)
git checkout -b feature/experiment-transformer-v2
```

**Using Git Extension:**
1. Open Git panel
2. Click **Pull** button
3. Click branch dropdown → **New Branch** → Enter name → Create

### During Work: Save Your Progress

**Every 1-2 hours, commit your work:**

```bash
# Terminal approach
git status                          # See what changed
git add notebooks/03_training.ipynb # Stage specific files
git add src/models/transformer.py
git commit -m "Add transformer architecture with attention layers"

# Or stage all changes
git add -A
git commit -m "Complete data preprocessing pipeline"
```

**Using Git Extension:**
1. See changed files in **Changes** section
2. Click **+** to stage files
3. Enter commit message
4. Click **Commit**

### Before Lunch/End of Day: Push Your Work

```bash
# Terminal approach
git push origin feature/experiment-transformer-v2

# If pushing to main branch
git push origin main
```

**Using Git Extension:**
1. Click **Push** button (upload icon)
2. Confirm if prompted

### Notebook Best Practices

**⚠️ IMPORTANT: Clear notebook outputs before committing!**

```bash
# Option 1: Use jupyter nbconvert
jupyter nbconvert --clear-output --inplace notebooks/*.ipynb

# Option 2: Install and use nbstripout (recommended)
pip install nbstripout
nbstripout notebooks/03_training.ipynb

# Option 3: Configure nbstripout for auto-stripping
nbstripout --install
```

**In JupyterLab:**
1. Open notebook
2. Menu: Edit → Clear All Outputs
3. Save notebook
4. Then commit

---

## Collaboration Tips

### Feature Branch Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Work on Your Feature**
   - Make commits regularly
   - Push to GitHub frequently

3. **Create Pull Request**
   - Go to GitHub.com
   - Click "Pull Request"
   - Select your branch → main
   - Add description of changes
   - Request review from teammates

4. **Merge After Review**
   - Address any comments
   - Once approved, merge on GitHub
   - Delete feature branch

### Syncing with Team Changes

**Before Starting New Work:**
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Create new feature branch
git checkout -b feature/new-feature
```

**Update Your Feature Branch:**
```bash
# While on your feature branch
git checkout feature/your-feature

# Get latest from main
git merge main

# Or use rebase (cleaner history)
git rebase main
```

### Resolving Conflicts

**When a merge conflict occurs:**

1. **Git will mark conflicting files**
   ```bash
   git status  # See conflicting files
   ```

2. **Open conflicting file in JupyterLab**
   Look for conflict markers:
   ```python
   <<<<<<< HEAD
   your_code_here
   =======
   teammate_code_here
   >>>>>>> main
   ```

3. **Resolve the conflict**
   - Keep your changes, their changes, or combine both
   - Remove conflict markers

4. **Mark as resolved**
   ```bash
   git add resolved_file.py
   git commit -m "Resolve merge conflict in model.py"
   ```

**Using Git Extension for Conflicts:**
1. Conflicted files appear with ⚠️ icon
2. Click file to open diff view
3. Edit to resolve
4. Stage resolved file
5. Commit

### Communication Best Practices

1. **Commit Messages**: Be descriptive
   ```bash
   # ❌ Bad
   git commit -m "update"
   git commit -m "fix bug"
   
   # ✅ Good
   git commit -m "Add transformer model with 8 attention heads"
   git commit -m "Fix shape mismatch in preprocessing pipeline"
   git commit -m "Improve training speed by 30% with XLA compilation"
   ```

2. **Pull Requests**: Include
   - What changes were made
   - Why they were made
   - How to test them
   - Any breaking changes

3. **Code Review**: 
   - Review teammates' PRs promptly
   - Give constructive feedback
   - Test changes locally if possible

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Permission Denied" When Pushing

**Problem**: Authentication failed

**Solution**:
```bash
# Use personal access token as password
# Or set up SSH keys (see Initial Setup section)

# Store credentials (so you don't type token each time)
git config --global credential.helper store
git push  # Enter token once, it will be saved
```

#### 2. Accidental Commit of Large Files

**Problem**: Committed data file or checkpoint

**Solution**:
```bash
# Remove from last commit (before pushing)
git rm --cached large_file.nc
git commit --amend -m "Remove large file from commit"

# If already pushed, use git filter-branch or BFG Repo-Cleaner
# (Ask team lead for help with this)
```

#### 3. Diverged Branches

**Problem**: "Your branch and 'origin/main' have diverged"

**Solution**:
```bash
# Option 1: Merge (preserves history)
git pull origin main

# Option 2: Rebase (cleaner history)
git pull --rebase origin main
```

#### 4. Accidentally Modified Wrong Branch

**Solution**:
```bash
# Stash your changes
git stash

# Switch to correct branch
git checkout feature/correct-branch

# Apply stashed changes
git stash pop
```

#### 5. Want to Undo Last Commit

**Solution**:
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit (⚠️ careful!)
git reset --hard HEAD~1
```

### Getting Help

```bash
# Git help
git help <command>
git help commit
git help merge

# Check current status
git status
git log --oneline -10  # Last 10 commits

# See what changed
git diff                # Unstaged changes
git diff --staged      # Staged changes
git diff main          # Difference from main branch
```

---

## Quick Reference Card

### Essential Commands

```bash
# Status and Info
git status                          # Check status
git log --oneline -10              # Recent commits
git diff                           # See changes

# Daily Workflow
git pull origin main               # Get latest
git add file.py                    # Stage file
git commit -m "message"            # Commit
git push origin branch-name        # Push

# Branching
git branch                         # List branches
git checkout -b feature/new        # Create & switch
git checkout main                  # Switch to main
git merge feature/new              # Merge branch

# Undo Operations
git checkout -- file.py            # Discard changes
git reset HEAD file.py             # Unstage file
git reset --soft HEAD~1            # Undo last commit

# Remote
git remote -v                      # Show remotes
git fetch origin                   # Fetch updates
git pull origin main               # Pull & merge
```

### Git Extension Shortcuts

- **Stage File**: Click **+** icon
- **Unstage File**: Click **-** icon
- **Commit**: Enter message → **Commit** button
- **Pull**: Click **↓** (pull icon)
- **Push**: Click **↑** (push icon)
- **New Branch**: Branch dropdown → **+**
- **View Diff**: Click on file name

---

## Additional Resources

- [GitHub Official Guide](https://docs.github.com/en/get-started)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [JupyterLab Git Extension Docs](https://github.com/jupyterlab/jupyterlab-git)
- [Pro Git Book (Free)](https://git-scm.com/book/en/v2)

---

## Team Conventions for NYC LEAP Project

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `experiment/description` - Experimental work
- `docs/description` - Documentation updates

### Commit Message Format
```
<type>: <subject>

<body (optional)>

Examples:
feat: Add CNN-based climate emulator
fix: Correct temperature normalization in preprocessing
docs: Update installation instructions
experiment: Test transformer architecture with 16 layers
```

### Code Review Requirements
- At least 1 reviewer approval for merging to main
- All tests must pass (if we add CI/CD)
- Clear outputs from notebooks before PR

### File Organization
- Keep notebooks in `notebooks/`
- Keep reusable code in `src/`
- Store data in `/leap-scratch/` or OSN
- Never commit checkpoints or large data files

---

**Questions?** Ask the team on Slack/Discord or create a GitHub Issue!
