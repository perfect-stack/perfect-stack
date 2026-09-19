import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import * as path from 'path';

let backendProcess: ChildProcess | null = null;
let frontendProcess: ChildProcess | null = null;

async function isPortOpen(port: number, pathName = '/'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: pathName, timeout: 1500 }, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port: number, pathName = '/', maxWaitMs = 35000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isPortOpen(port, pathName)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

export async function ensureBackendRunning(): Promise<void> {
  const isRunning = await isPortOpen(3080, '/meta/entity');
  if (isRunning) {
    console.log('Backend already running on http://localhost:3080');
    return;
  }

  console.log('Starting Vet Clinic Backend server on port 3080...');
  const serverDir = path.resolve(__dirname, '../server');
  backendProcess = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'], {
    cwd: serverDir,
    stdio: 'pipe',
    env: { ...process.env, PORT: '3080' },
  });

  backendProcess.stdout?.on('data', () => {});
  backendProcess.stderr?.on('data', () => {});

  const ready = await waitForServer(3080, '/meta/entity', 30000);
  if (!ready) {
    throw new Error('Timed out waiting for Vet Clinic Backend server to start on port 3080');
  }
  console.log('Backend server is ready on http://localhost:3080');
}

export async function ensureFrontendRunning(): Promise<void> {
  const isRunning = await isPortOpen(4200, '/');
  if (isRunning) {
    console.log('Frontend already running on http://localhost:4200');
    return;
  }

  console.log('Starting Vet Clinic Frontend on http://localhost:4200 (ng serve)...');
  const clientDir = path.resolve(__dirname, '../client');
  frontendProcess = spawn('npx', ['ng', 'serve', '--port', '4200', '--host', '0.0.0.0'], {
    cwd: clientDir,
    stdio: 'pipe',
    env: { ...process.env },
  });

  frontendProcess.stdout?.on('data', () => {});
  frontendProcess.stderr?.on('data', () => {});

  const ready = await waitForServer(4200, '/', 40000);
  if (!ready) {
    throw new Error('Timed out waiting for Vet Clinic Frontend to start on port 4200');
  }
  console.log('Frontend server is ready on http://localhost:4200');
}

export async function stopServers(): Promise<void> {
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
    frontendProcess = null;
  }
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}
