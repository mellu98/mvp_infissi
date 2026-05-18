import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { StorageProvider, UploadResult, FileMeta } from './types';

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || '/app/uploads';

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(params: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    prefix?: string;
  }): Promise<UploadResult> {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = randomUUID();
    const safeName = params.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${timestamp}-${uuid}-${safeName}`;

    const dir = params.prefix ? join(UPLOAD_DIR, params.prefix) : UPLOAD_DIR;
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, fileName);
    await writeFile(filePath, params.buffer);

    const key = params.prefix ? `${params.prefix}/${fileName}` : fileName;
    const url = `/api/files/${key}`;

    return { key, url };
  }

  async getFileUrl(key: string): Promise<string> {
    return `/api/files/${key}`;
  }

  async readFile(key: string): Promise<Buffer> {
    const filePath = join(UPLOAD_DIR, key);
    return readFile(filePath);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = join(UPLOAD_DIR, key);
    await unlink(filePath);
  }

  async listFiles(prefix?: string): Promise<FileMeta[]> {
    const dir = prefix ? join(UPLOAD_DIR, prefix) : UPLOAD_DIR;
    const entries = await readdir(dir, { withFileTypes: true });
    const files: FileMeta[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = join(dir, entry.name);
        const s = await stat(filePath);
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        files.push({
          key,
          fileName: entry.name,
          size: s.size,
          createdAt: s.birthtime,
        });
      }
    }

    return files;
  }
}
