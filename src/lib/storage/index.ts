import { LocalStorageProvider } from './local';
import { AppwriteStorageProvider } from './appwrite';
import type { StorageProvider } from './types';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      return new LocalStorageProvider();
    case 'appwrite':
      return new AppwriteStorageProvider();
    default:
      throw new StorageError(`Storage provider non supportato: ${provider}`);
  }
}

export type { StorageProvider, UploadResult, FileMeta } from './types';
