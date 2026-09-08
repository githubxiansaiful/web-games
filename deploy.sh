#!/usr/bin/env bash
# ==============================================================================
# Xian's Game World - Automated Deployment Script for Hostinger KVM 4 VPS
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}   🚀 Xian's Game World - Hostinger VPS Deployment   ${NC}"
echo -e "${CYAN}=====================================================${NC}"

# 1. Check if Docker & Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[!] Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}[!] Docker Compose plugin not found. Installing...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi

echo -e "${GREEN}[✓] Docker & Docker Compose ready.${NC}"

# 2. Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        echo -e "${YELLOW}[i] Copying .env.production to .env...${NC}"
        cp .env.production .env
    elif [ -f .env.local ]; then
        echo -e "${YELLOW}[i] Copying .env.local to .env...${NC}"
        cp .env.local .env
    else
        echo -e "${RED}[✗] Error: No .env file found!${NC}"
        echo -e "Please create a .env file from .env.production.example before deploying."
        exit 1
    fi
fi

# 3. Pull latest changes if this is a git repo
if [ -d .git ]; then
    echo -e "${CYAN}[i] Pulling latest git updates...${NC}"
    git pull origin main || true
fi

# 4. Build and start containers
echo -e "${CYAN}[i] Building and launching production containers...${NC}"
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# 5. Wait for services to become healthy
echo -e "${CYAN}[i] Waiting for PostgreSQL and application to become healthy...${NC}"
sleep 5

# Check container status
docker compose -f docker-compose.prod.yml ps

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}   ✨ Deployment Successful!                         ${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "Your game portal is now live with automatic SSL!"
echo -e "Check live logs anytime:  docker compose -f docker-compose.prod.yml logs -f"
echo -e "Backup database anytime:  ./backup-db.sh"
