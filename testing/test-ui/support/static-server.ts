import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Lightweight SPA static web server that mimics AWS CloudFront / S3 hosting.
 * Serves pre-built Angular assets and falls back to index.html for client-side routes.
 */
export class SpaStaticServer {
  private server: http.Server | null = null;
  private rootDir: string;
  private port: number;

  constructor(rootDir: string, port = 4200) {
    this.rootDir = path.resolve(rootDir);
    this.port = port;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (err) => {
        console.error(`[SpaStaticServer Error]: ${err.message}`);
        reject(err);
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const rawUrl = req.url || '/';
    const parsedPath = rawUrl.split('?')[0];
    let decodedPath = '';
    try {
      decodedPath = decodeURIComponent(parsedPath);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

    let filePath = path.join(this.rootDir, decodedPath);

    // Prevent path traversal
    if (!filePath.startsWith(this.rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // If requesting a directory, look for index.html inside it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // Direct static file hit
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // CloudFront SPA fallback: if not an existing static asset with an extension (or is html), serve index.html
    const ext = path.extname(decodedPath).toLowerCase();
    if (!ext || ext === '.html') {
      const indexPath = path.join(this.rootDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        });
        fs.createReadStream(indexPath).pipe(res);
        return;
      }
    }

    // 404 for missing static assets (e.g. .png, .js, .css)
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not Found: ${rawUrl}`);
  }
}
