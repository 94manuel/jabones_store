import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { BucketItem, BucketItemStat, Client } from 'minio';

export interface StoredFileSummary {
  key: string;
  fileName: string;
  size: number;
  contentType: string;
  lastModified: string;
  etag: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly enabled: boolean;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl: string;
  private readonly maxFileSizeBytes: number;
  private readonly client?: Client;
  private bucketReady = false;
  private bucketPromise?: Promise<void>;

  constructor(private readonly config: ConfigService) {
    const endPoint = this.config.get<string>('MINIO_ENDPOINT');
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001').replace(/\/$/, '');

    this.bucket = this.config.get<string>('MINIO_BUCKET', 'cocoesencia-files');
    this.region = this.config.get<string>('MINIO_REGION', 'us-east-1');
    this.publicBaseUrl = this.config
      .get<string>('MINIO_PUBLIC_BASE_URL', `${frontendUrl}/api/backend/files/public`)
      .replace(/\/$/, '');
    this.maxFileSizeBytes = this.config.get<number>('MINIO_MAX_FILE_SIZE_MB', 25) * 1024 * 1024;

    if (!endPoint || !accessKey || !secretKey) {
      this.enabled = false;
      this.logger.warn('MinIO no esta configurado por completo. Los endpoints de archivos responderan 503 hasta definir las variables de entorno.');
      return;
    }

    this.enabled = true;
    this.client = new Client({
      endPoint,
      port: this.config.get<number>('MINIO_PORT', 9000),
      useSSL: this.config.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey,
      secretKey,
      region: this.region,
      pathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<StoredFileSummary> {
    const client = this.getClient();

    if (!file?.buffer?.length) {
      throw new InternalServerErrorException('No se recibio ningun archivo para cargar.');
    }

    if (file.size > this.maxFileSizeBytes) {
      const limitMb = Math.floor(this.maxFileSizeBytes / 1024 / 1024);
      throw new PayloadTooLargeException(`El archivo excede el limite configurado de ${limitMb} MB.`);
    }

    await this.ensureBucket();

    const objectName = this.buildObjectName(file.originalname, folder);
    const contentType = file.mimetype?.trim() || 'application/octet-stream';

    try {
      await client.putObject(this.bucket, objectName, file.buffer, file.size, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'x-amz-meta-original-name': encodeURIComponent(file.originalname),
      });

      const stat = await client.statObject(this.bucket, objectName);
      return this.toSummary(objectName, stat);
    } catch (error) {
      this.logger.error(`Fallo la carga de ${objectName} en MinIO.`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('No fue posible guardar el archivo en MinIO.');
    }
  }

  async listFiles(prefix?: string, limit = 20): Promise<StoredFileSummary[]> {
    const client = this.getClient();
    await this.ensureBucket();

    const normalizedPrefix = this.normalizePrefix(prefix);
    const items = await this.collectObjects(normalizedPrefix);

    const selectedItems = items
      .sort((left: Extract<BucketItem, { name: string }>, right: Extract<BucketItem, { name: string }>) => right.lastModified.getTime() - left.lastModified.getTime())
      .slice(0, Math.max(1, Math.min(limit, 100)));

    return Promise.all(
      selectedItems.map(async (item: Extract<BucketItem, { name: string }>) => {
        const stat = await client.statObject(this.bucket, item.name);
        return this.toSummary(item.name, stat);
      }),
    );
  }

  async getFileStream(key: string): Promise<{ stream: NodeJS.ReadableStream; file: StoredFileSummary }> {
    const client = this.getClient();
    await this.ensureBucket();

    const objectName = this.normalizeObjectKey(key);

    try {
      const [stream, stat] = await Promise.all([
        client.getObject(this.bucket, objectName),
        client.statObject(this.bucket, objectName),
      ]);

      return { stream, file: this.toSummary(objectName, stat) };
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        throw new NotFoundException('No se encontro el archivo solicitado.');
      }

      this.logger.error(`No fue posible leer ${objectName} desde MinIO.`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('No fue posible recuperar el archivo.');
    }
  }

  private getClient(): Client {
    if (!this.enabled || !this.client) {
      throw new ServiceUnavailableException('MinIO no esta configurado en este ambiente.');
    }
    return this.client;
  }

  private async ensureBucket(): Promise<void> {
    this.getClient();

    if (this.bucketReady) {
      return;
    }

    if (!this.bucketPromise) {
      this.bucketPromise = this.ensureBucketOnce();
    }

    await this.bucketPromise;
  }

  private async ensureBucketOnce(): Promise<void> {
    const client = this.getClient();
    const autoCreate = this.config.get<string>('MINIO_AUTO_CREATE_BUCKET', 'true') === 'true';

    try {
      const exists = await client.bucketExists(this.bucket);
      if (!exists) {
        if (!autoCreate) {
          throw new ServiceUnavailableException(`El bucket ${this.bucket} no existe y MINIO_AUTO_CREATE_BUCKET=false.`);
        }
        await client.makeBucket(this.bucket, this.region);
      }
      this.bucketReady = true;
    } catch (error) {
      this.bucketPromise = undefined;
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`No fue posible inicializar el bucket ${this.bucket}.`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('MinIO no esta listo para almacenar archivos en este momento.');
    }
  }

  private collectObjects(prefix?: string): Promise<Array<Extract<BucketItem, { name: string }>>> {
    const client = this.getClient();

    return new Promise((resolve, reject) => {
      const items: Array<Extract<BucketItem, { name: string }>> = [];
      const stream = client.listObjectsV2(this.bucket, prefix || undefined, true);

      stream.on('data', (item: BucketItem) => {
        if ('name' in item && item.name) {
          items.push(item);
        }
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(items));
    });
  }

  private toSummary(key: string, stat: BucketItemStat): StoredFileSummary {
    const fileName = this.getOriginalName(stat.metaData) ?? key.split('/').pop() ?? key;
    const contentType = this.getMetadataValue(stat.metaData, 'content-type') ?? 'application/octet-stream';

    return {
      key,
      fileName,
      size: stat.size,
      contentType,
      lastModified: stat.lastModified.toISOString(),
      etag: stat.etag,
      publicUrl: `${this.publicBaseUrl}?key=${encodeURIComponent(key)}`,
    };
  }

  private getOriginalName(metaData: Record<string, unknown>): string | undefined {
    const rawName = this.getMetadataValue(metaData, 'x-amz-meta-original-name');
    if (!rawName) {
      return undefined;
    }

    try {
      return decodeURIComponent(rawName);
    } catch {
      return rawName;
    }
  }

  private getMetadataValue(metaData: Record<string, unknown>, key: string): string | undefined {
    const match = Object.entries(metaData ?? {}).find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase());
    return typeof match?.[1] === 'string' ? match[1] : undefined;
  }

  private buildObjectName(originalName: string, folder?: string): string {
    const extension = this.normalizeExtension(extname(originalName));
    const fileName = this.slugify(originalName.replace(new RegExp(`${this.escapeRegExp(extension)}$`), '')) || 'archivo';
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const segments = [this.normalizePrefix(folder), datePrefix, `${randomUUID()}-${fileName}${extension}`].filter(Boolean);
    return segments.join('/');
  }

  private normalizeObjectKey(key: string): string {
    const normalized = key.trim().replace(/\\+/g, '/').replace(/^\/+/, '');
    if (!normalized) {
      throw new NotFoundException('Debe indicar la clave del archivo.');
    }
    return normalized;
  }

  private normalizePrefix(prefix?: string): string | undefined {
    if (!prefix) {
      return undefined;
    }

    const normalized = prefix
      .split(/[\\/]+/)
      .map((segment) => this.slugify(segment))
      .filter(Boolean)
      .join('/');

    return normalized || undefined;
  }

  private normalizeExtension(extension: string): string {
    const sanitized = extension
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '')
      .toLowerCase();

    return /^\.[a-z0-9]{1,12}$/.test(sanitized) ? sanitized : '';
  }

  private slugify(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}