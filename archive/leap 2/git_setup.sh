#!/bin/bash
# Git Setup Script for NYC LEAP Climate Emulator
# Run this on LEAP Pangeo JupyterHub to initialize Git and push to GitHub

set -e  # Exit on error

echo "========================================================================"
echo "NYC LEAP Climate Emulator - Git Setup Script"
echo "========================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -f ".gitignore" ]; then
    print_error "This script must be run from the nycleap repository root!"
    exit 1
fi

echo "Step 1: Checking Git configuration..."
echo "------------------------------------"

# Check if Git is configured
if ! git config --global user.name > /dev/null 2>&1; then
    print_warning "Git user.name not set!"
    read -p "Enter your full name: " user_name
    git config --global user.name "$user_name"
    print_success "Set Git user.name to: $user_name"
else
    current_name=$(git config --global user.name)
    print_success "Git user.name already set to: $current_name"
fi

if ! git config --global user.email > /dev/null 2>&1; then
    print_warning "Git user.email not set!"
    read -p "Enter your email: " user_email
    git config --global user.email "$user_email"
    print_success "Set Git user.email to: $user_email"
else
    current_email=$(git config --global user.email)
    print_success "Git user.email already set to: $current_email"
fi

# Set helpful defaults
git config --global init.defaultBranch main
git config --global merge.conflictstyle diff3
git config --global credential.helper store

print_success "Git configuration complete!"
echo ""

echo "Step 2: Initializing Git repository..."
echo "---------------------------------------"

# Check if already initialized
if [ -d ".git" ]; then
    print_warning "Git repository already initialized"
    
    # Check remote
    if git remote get-url origin > /dev/null 2>&1; then
        current_remote=$(git remote get-url origin)
        print_success "Remote 'origin' already set to: $current_remote"
    else
        print_warning "No remote 'origin' configured"
        read -p "Enter GitHub repository URL (https://github.com/RyanRana/nycleap.git): " repo_url
        repo_url=${repo_url:-"https://github.com/RyanRana/nycleap.git"}
        git remote add origin "$repo_url"
        print_success "Added remote 'origin': $repo_url"
    fi
else
    # Initialize new repository
    git init
    print_success "Initialized new Git repository"
    
    # Add remote
    read -p "Enter GitHub repository URL (default: https://github.com/RyanRana/nycleap.git): " repo_url
    repo_url=${repo_url:-"https://github.com/RyanRana/nycleap.git"}
    git remote add origin "$repo_url"
    print_success "Added remote 'origin': $repo_url"
fi

echo ""

echo "Step 3: Creating project structure..."
echo "--------------------------------------"

# Create directory structure if it doesn't exist
mkdir -p notebooks
mkdir -p src/{data,models,training,utils,evaluation}
mkdir -p scripts
mkdir -p configs/{model_configs,experiment_configs}
mkdir -p tests
mkdir -p docs
mkdir -p examples

# Create __init__.py files
touch src/__init__.py
touch src/data/__init__.py
touch src/models/__init__.py
touch src/training/__init__.py
touch src/utils/__init__.py
touch src/evaluation/__init__.py
touch tests/__init__.py

print_success "Project structure created!"
echo ""

echo "Step 4: Staging files for commit..."
echo "------------------------------------"

# Check status
git status

# Add all files
git add .

# Show what will be committed
echo ""
echo "Files staged for commit:"
git diff --cached --name-only

echo ""

echo "Step 5: Creating initial commit..."
echo "-----------------------------------"

# Check if there are changes to commit
if git diff --cached --quiet; then
    print_warning "No changes to commit"
else
    git commit -m "Initial commit: NYC LEAP Climate Emulator setup

- Add project structure and documentation
- Add .gitignore for ML projects
- Add Git workflow documentation
- Add setup instructions and requirements
- Add startup notebook for LEAP Pangeo JupyterHub"
    
    print_success "Initial commit created!"
fi

echo ""

echo "Step 6: Setting up branch..."
echo "----------------------------"

# Ensure we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    git branch -M main
    print_success "Renamed branch to 'main'"
else
    print_success "Already on 'main' branch"
fi

echo ""

echo "Step 7: Pushing to GitHub..."
echo "----------------------------"

print_warning "You will need to authenticate with GitHub"
print_warning "Use your Personal Access Token as the password"
echo ""

read -p "Ready to push to GitHub? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try to push
    if git push -u origin main; then
        print_success "Successfully pushed to GitHub!"
    else
        print_error "Failed to push to GitHub"
        echo ""
        echo "Troubleshooting tips:"
        echo "1. Make sure you have a Personal Access Token"
        echo "   GitHub → Settings → Developer settings → Personal access tokens"
        echo "2. Use your GitHub username as the username"
        echo "3. Use the Personal Access Token as the password"
        echo ""
        echo "You can try pushing manually:"
        echo "  git push -u origin main"
        exit 1
    fi
else
    print_warning "Skipped pushing to GitHub"
    echo "You can push later with: git push -u origin main"
fi

echo ""
echo "========================================================================"
echo "✅ Git Setup Complete!"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "1. Create your scratch directory:"
echo "   mkdir -p /home/jovyan/leap-scratch/\$USER"
echo ""
echo "2. Run the startup notebook:"
echo "   Open leap_startup.ipynb and run all cells"
echo ""
echo "3. Start working on a feature branch:"
echo "   git checkout -b feature/your-feature-name"
echo ""
echo "4. Read the documentation:"
echo "   - README.md - Project overview"
echo "   - SETUP.md - Detailed setup guide"
echo "   - GIT_WORKFLOW_JUPYTERLAB.md - Git workflow tips"
echo ""
echo "Happy coding! 🚀"
echo ""
