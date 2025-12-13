#!/bin/bash
# Vercel install script for monorepo
# This script installs dependencies for both backend and frontend

set -e  # Exit on error

echo "Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps || npm install
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps || npm install
cd ..

echo "Installation complete!"

