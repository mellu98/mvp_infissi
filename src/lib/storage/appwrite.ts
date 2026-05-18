import type { StorageProvider, UploadResult, FileMeta } from './types';
import { StorageError } from '.';

export class AppwriteStorageProvider implements StorageProvider {
  async uploadFile(): Promise<UploadResult> {
    throw new StorageError('Appwrite storage non implementato. Usa STORAGE_PROVIDER=local');
  }

  async getFileUrl(): Promise<string> {
    throw new StorageError('Appwrite storage non implementato. Usa STORAGE_PROVIDER=local');
  }

  async readFile(): Promise<Buffer> {
    throw new StorageError('Appwrite storage non implementato. Usa STORAGE_PROVIDER=local');
  }

  async deleteFile(): Promise<void> {
    throw new StorageError('Appwrite storage non implementato. Usa STORAGE_PROVIDER=local');
  }

  async listFiles(): Promise<FileMeta[]> {
    throw new StorageError('Appwrite storage non implementato. Usa STORAGE_PROVIDER=local');
  }
}
