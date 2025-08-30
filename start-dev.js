#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Grievance System Development Environment...\n');

// Start backend server
console.log('📡 Starting Backend API Server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('\n🌐 Starting Frontend Development Server...');
  const frontend = spawn('npm', ['start'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    backend.kill('SIGINT');
  });

}, 3000);

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

console.log('\n📋 Development servers starting...');
console.log('   Backend API: http://localhost:5000');
console.log('   Frontend:    http://localhost:3000');
console.log('\n   Press Ctrl+C to stop both servers\n');