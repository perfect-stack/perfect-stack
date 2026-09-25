import { spawn, execSync, ChildProcess } from 'child_process';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { SpaStaticServer } from './static-server';

let backendProcess: ChildProcess | null = null;
let spaServer: SpaStaticServer | null = null;

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
    console.log('Backend already running on http://127.0.0.1:3080');
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
  console.log('Backend server is ready on http://127.0.0.1:3080');
}

export async function ensureFrontendRunning(): Promise<void> {
  const isRunning = await isPortOpen(4200, '/');
  if (isRunning) {
    console.log('Frontend already running on http://127.0.0.1:4200');
    return;
  }

  const workspaceDir = path.resolve(__dirname, '../../../angular-workspace');
  let distDir = path.resolve(workspaceDir, 'dist/test-ui-client/browser');

  if (!fs.existsSync(distDir) && fs.existsSync(path.resolve(workspaceDir, 'dist/test-ui-client/index.html'))) {
    distDir = path.resolve(workspaceDir, 'dist/test-ui-client');
  }

  const indexPath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('Static distribution not found. Building Vet Clinic Frontend in angular-workspace (npx ng build test-ui-client)...');
    execSync('npm run build:lib && npx ng build test-ui-client', { cwd: workspaceDir, stdio: 'inherit' });
    if (!fs.existsSync(indexPath)) {
      if (fs.existsSync(path.resolve(workspaceDir, 'dist/test-ui-client/browser/index.html'))) {
        distDir = path.resolve(workspaceDir, 'dist/test-ui-client/browser');
      } else if (fs.existsSync(path.resolve(workspaceDir, 'dist/test-ui-client/index.html'))) {
        distDir = path.resolve(workspaceDir, 'dist/test-ui-client');
      } else {
        throw new Error(`Build completed but index.html not found in ${distDir}`);
      }
    }
  }

  console.log(`Starting CloudFront-like SPA Static Server from ${distDir} on port 4200...`);
  spaServer = new SpaStaticServer(distDir, 4200);
  await spaServer.start();

  const ready = await waitForServer(4200, '/', 15000);
  if (!ready) {
    throw new Error('Timed out waiting for Frontend SPA static server to start on port 4200');
  }
  console.log('Frontend SPA server is ready on http://127.0.0.1:4200');
}

export async function stopServers(): Promise<void> {
  if (spaServer) {
    await spaServer.stop();
    spaServer = null;
  }
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}
