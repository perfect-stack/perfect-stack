import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import * as path from 'path';

let backendProcess: ChildProcess | null = null;
let frontendProcess: ChildProcess | null = null;

async function isPortOpen(port: number, pathName = '/'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: pathName, timeout: 2000 }, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port: number, pathName = '/', maxWaitMs = 60000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isPortOpen(port, pathName)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
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

  backendProcess.stdout?.on('data', (d) => {
    const text = d.toString();
    if (process.env.DEBUG || process.env.CI) {
      console.log(`[Backend stdout]: ${text.trim()}`);
    }
  });
  backendProcess.stderr?.on('data', (d) => {
    console.error(`[Backend stderr]: ${d.toString().trim()}`);
  });
  backendProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[Backend process exited with code ${code}, signal: ${signal}]`);
    }
  });

  const ready = await waitForServer(3080, '/meta/entity', 45000);
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

  let isCompiled = false;

  frontendProcess.stdout?.on('data', (d) => {
    const text = d.toString();
    if (process.env.DEBUG || process.env.CI) {
      console.log(`[Frontend stdout]: ${text.trim()}`);
    }
    if (
      text.includes('Application bundle generation complete') ||
      text.includes('Compiled successfully') ||
      text.includes('Watch mode enabled') ||
      text.includes('Angular Live Development Server is listening')
    ) {
      isCompiled = true;
    }
  });
  frontendProcess.stderr?.on('data', (d) => {
    console.error(`[Frontend stderr]: ${d.toString().trim()}`);
  });
  frontendProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[Frontend process exited with code ${code}, signal: ${signal}]`);
    }
  });

  const start = Date.now();
  const maxWaitMs = 90000;
  while (Date.now() - start < maxWaitMs) {
    if (isCompiled && (await isPortOpen(4200, '/'))) {
      console.log('Frontend server is compiled and ready on http://localhost:4200');
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Fallback check if port is open after timeout
  if (await isPortOpen(4200, '/')) {
    console.log('Frontend port is open on http://localhost:4200 (compilation wait finished)');
    return;
  }

  throw new Error('Timed out waiting for Vet Clinic Frontend to start and compile on port 4200');
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
