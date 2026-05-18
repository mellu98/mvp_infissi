export interface FileMeta {
  key: string;
  fileName: string;
  size: number;
  createdAt: Date;
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  uploadFile(params: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    prefix?: string;
  }): Promise<UploadResult>;

  getFileUrl(key: string): Promise<string>;

  readFile(key: string): Promise<Buffer>;

  deleteFile(key: string): Promise<void>;

  listFiles(prefix?: string): Promise<FileMeta[]>;
}
