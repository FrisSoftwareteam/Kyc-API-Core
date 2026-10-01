import fs from 'fs';
import cloudinary, { v2 as cloudinaryV2 } from 'cloudinary';
import { InternalError } from '../../errors/api.error';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const streamifier = require('streamifier');

export default class CloudinaryUploader {
  private readonly logger;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    cloudinaryV2.config({
      cloud_name: config.get('cloudinary.name'),
      api_key: config.get('cloudinary.apiKey'),
      api_secret: config.get('cloudinary.apiSecret'),
    });

    this.logger = logger;
  }

  private isBase64Jpeg(base64String: string) {
    // const expectedPrefix = 'data:image/jpeg;base64,';
    const expectedPrefix = 'data:image/';

    // Check if the base64String starts with the expected prefix
    return base64String?.startsWith(expectedPrefix);
  }

  async uploadBase64(imageStr: string, uploadPath: string, publicId?: string) {
    const { logger } = this;

    try {
      const isValidBase64 = this.isBase64Jpeg(imageStr);

      if (!isValidBase64) {
        imageStr = `data:image/jpeg;base64,${imageStr}`;
      }

      const response = await cloudinaryV2.uploader.upload(imageStr, {
        folder: uploadPath,
        overwrite: true,
        ...(publicId ? { public_id: publicId } : undefined),
      });

      return response?.secure_url;
    } catch (err) {
      logger.error(JSON.stringify(err));
      throw new InternalError('Something went wrong', { code: 'CLOUDINARY_UPLOAD_ERROR' });
    }
  }

  async uploadFile(
    filePath: string | Buffer | Uint8Array,
    options: cloudinary.UploadApiOptions,
  ): Promise<cloudinary.UploadApiResponse> {
    const { logger } = this;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(options, (error, result) => {
        if (result) {
          resolve(result);
        } else {
          logger.error(JSON.stringify(error));
          reject(error);
        }
      });
      fs.createReadStream(filePath as string).pipe(uploadStream);
    });
  }

  async uploadBuffer(
    buffer: Buffer | Uint8Array,
    options: cloudinary.UploadApiOptions,
  ): Promise<cloudinary.UploadApiResponse> {
    const { logger } = this;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(options, (error, result) => {
        if (result) {
          resolve(result);
        } else {
          logger.error(JSON.stringify(error));
          reject(error);
        }
      });

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }
}
