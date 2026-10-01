import fs from 'fs';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export default class MicrosoftBlobUploader {
  private readonly config;
  private readonly logger;
  private readonly serviceClient;
  private readonly containerName = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    this.config = config;
    this.logger = logger;
    this.serviceClient = new BlobServiceClient(
      `https://${config.get('azureStorage.accountName')}.blob.core.windows.net`,
      new StorageSharedKeyCredential(
        config.get('azureStorage.accountName'),
        config.get('azureStorage.accountKey'),
      ),
    );
  }

  async uploadFile(fileName: string, filePath: string) {
    const { serviceClient, containerName, logger } = this;

    const containerClient = serviceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    logger.info(`Uploading to Azure storage as blob:\n\t${fileName}`);

    const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
    logger.info(`Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`);
  }

  async streamToBuffer(readableStream: NodeJS.ReadableStream) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chunks: any = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  async downloadFile(fileName: string, downloadFilePath: string) {
    const { serviceClient, containerName, logger } = this;

    const containerClient = serviceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    logger.info(`Downloading blob:\n\t${fileName}`);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const downloaded = await this.streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody as NodeJS.ReadableStream,
    );

    fs.writeFileSync(downloadFilePath, downloaded as string);
    logger.info(`Downloaded blob content to ${downloadFilePath}`);
  }
}
