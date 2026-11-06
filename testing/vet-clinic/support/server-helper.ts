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

function hasNewerFile(dir: string, targetMtime: number): boolean {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.angular') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (hasNewerFile(fullPath, targetMtime)) return true;
    } else {
      if (fs.statSync(fullPath).mtimeMs > targetMtime) return true;
    }
  }
  return false;
}

function isDistStale(distIndexPath: string, sourceDirs: string[]): boolean {
  if (process.env.REBUILD_FRONTEND === 'true') return true;
  if (!fs.existsSync(distIndexPath)) return true;
  const distMtime = fs.statSync(distIndexPath).mtimeMs;
  for (const dir of sourceDirs) {
    if (hasNewerFile(dir, distMtime)) return true;
  }
  return false;
}

export async function ensureBackendRunning(): Promise<void> {
  const isRunning = await isPortOpen(3180, '/meta/entity');
  if (isRunning) {
    console.log('Backend already running on http://127.0.0.1:3180');
    return;
  }

  console.log('Starting Vet Clinic Backend server on port 3180...');
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

  const ready = await waitForServer(3180, '/meta/entity', 45000);
  if (!ready) {
    throw new Error('Timed out waiting for Vet Clinic Backend server to start on port 3180');
  }
  console.log('Backend server is ready on http://127.0.0.1:3180');
}

export async function ensureFrontendRunning(): Promise<void> {
  const isHttps = await checkUrl('https', 4280, '/');
  if (isHttps) {
    process.env.BASE_URL = 'https://127.0.0.1:4280';
    console.log('Frontend already running on https://127.0.0.1:4280');
    return;
  }

  const isHttp = await checkUrl('http', 4280, '/');
  if (isHttp) {
    process.env.BASE_URL = 'http://127.0.0.1:4280';
    console.log('Frontend already running on http://127.0.0.1:4280');
    return;
  }

  const workspaceDir = path.resolve(__dirname, '../../../angular-workspace');
  let distDir = path.resolve(workspaceDir, 'dist/vet-clinic-client/browser');

  if (!fs.existsSync(distDir) && fs.existsSync(path.resolve(workspaceDir, 'dist/vet-clinic-client/index.html'))) {
    distDir = path.resolve(workspaceDir, 'dist/vet-clinic-client');
  }

  const indexPath = path.resolve(distDir, 'index.html');
  const sourceDirs = [
    path.resolve(__dirname, '../client/src'),
    path.resolve(workspaceDir, 'projects/ngx-perfect-stack/src')
  ];

  if (isDistStale(indexPath, sourceDirs)) {
    console.log('Static distribution is missing or outdated compared to sources. Building Vet Clinic Frontend in angular-workspace (npm run build:lib && npx ng build vet-clinic-client)...');
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

  console.log(`Starting CloudFront-like SPA Static Server from ${distDir} on port 4280...`);
  spaServer = new SpaStaticServer(distDir, 4280);
  await spaServer.start();

  const ready = await waitForServer(4280, '/', 15000);
  if (!ready) {
    throw new Error('Timed out waiting for Frontend SPA static server to start on port 4280');
  }
  process.env.BASE_URL = 'http://127.0.0.1:4280';
  console.log('Frontend SPA server is ready on http://127.0.0.1:4280');
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
