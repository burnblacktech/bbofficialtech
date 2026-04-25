#!/usr/bin/env node
// =====================================================
// UNIFIED STARTUP SCRIPT
// Starts both frontend and backend servers
// =====================================================

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting BurnBlack Platform...');
console.log('');

// Start backend server
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('[BACKEND]')) {
    console.log(`[BACKEND] ${output.replace('[BACKEND]', '').trim()}`);
  }
});

backend.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('[BACKEND]')) {
    console.log(`[BACKEND] ${output.replace('[BACKEND]', '').trim()}`);
  }
});

// Start frontend server
console.log('🎨 Starting frontend server...');
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true
});

frontend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('[FRONTEND]') || output.includes('webpack') || output.includes('compiled')) {
    console.log(`[FRONTEND] ${output.trim()}`);
  }
});

frontend.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('[FRONTEND]') || output.includes('webpack') || output.includes('compiled')) {
    console.log(`[FRONTEND] ${output.trim()}`);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('✅ Both servers starting...');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔗 Backend: http://localhost:3002');
console.log('');
console.log('Press Ctrl+C to stop both servers');
console.log('');