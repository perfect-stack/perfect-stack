import { spawn, execSync, ChildProcess } from 'child_process';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';
import { SpaStaticServer } from './static-server';

let backendProcess: ChildProcess | null = null;
let spaServer: SpaStaticServer | null = null;

async function checkUrl(protocol: 'http' | 'https', port: number, pathName = '/'): Promise<boolean> {
  const mod = protocol === 'https' ? https : http;
  return new Promise((resolve) => {
    const req = (mod as typeof http).get(
      { hostname: '127.0.0.1', port, path: pathName, timeout: 2000, rejectUnauthorized: false } as any,
      (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function isPortOpen(port: number, pathName = '/'): Promise<boolean> {
  const isHttp = await checkUrl('http', port, pathName);
  if (isHttp) return true;
  return await checkUrl('https', port, pathName);
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
  });

  backendProcess.stdout?.on('data', (data) => {
    const msg = data.toString();
    if (process.env.DEBUG_SERVER) {
      process.stdout.write(`[Backend] ${msg}`);
    }
  });

  backendProcess.stderr?.on('data', (data) => {
    const msg = data.toString();
    if (process.env.DEBUG_SERVER) {
      process.stderr.write(`[Backend ERROR] ${msg}`);
    }
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
  const isHttps = await checkUrl('https', 4200, '/');
  if (isHttps) {
    process.env.BASE_URL = 'https://127.0.0.1:4200';
    console.log('Frontend already running on https://127.0.0.1:4200');
    return;
  }

  const isHttp = await checkUrl('http', 4200, '/');
  if (isHttp) {
    process.env.BASE_URL = 'http://127.0.0.1:4200';
    console.log('Frontend already running on http://127.0.0.1:4200');
    return;
  }

  const workspaceDir = path.resolve(__dirname, '../../../angular-workspace');
  let distDir = path.resolve(workspaceDir, 'dist/vet-clinic-client/browser');

  if (!fs.existsSync(distDir) && fs.existsSync(path.resolve(workspaceDir, 'dist/vet-clinic-client/index.html'))) {
    distDir = path.resolve(workspaceDir, 'dist/vet-clinic-client');
  }

  const indexPath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('Static distribution not found. Building Vet Clinic Frontend in angular-workspace (npx ng build vet-clinic-client)...');
    execSync('npm run build:lib && npx ng build vet-clinic-client', { cwd: workspaceDir, stdio: 'inherit' });
    if (!fs.existsSync(indexPath)) {
      if (fs.existsSync(path.resolve(workspaceDir, 'dist/vet-clinic-client/browser/index.html'))) {
        distDir = path.resolve(workspaceDir, 'dist/vet-clinic-client/browser');
      } else if (fs.existsSync(path.resolve(workspaceDir, 'dist/vet-clinic-client/index.html'))) {
        distDir = path.resolve(workspaceDir, 'dist/vet-clinic-client');
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
  process.env.BASE_URL = 'http://127.0.0.1:4200';
  console.log('Frontend SPA server is ready on http://127.0.0.1:4200');
}

export async function stopServers(): Promise<void> {
  if (spaServer) {
    await spaServer.stop();
    spaServer = null;
  }

  if (backendProcess) {
    console.log('Stopping Vet Clinic Backend server...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}
