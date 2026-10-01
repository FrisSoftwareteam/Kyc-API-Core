import * as fs from 'fs';
import * as path from 'path';
import { format } from '@fast-csv/format';

const tmpLocalPath = path.resolve(__dirname, '../../storage');

export const createFileStream = (business: string, headers: string[]) => {
  const fileName = `${business}_${Date.now()}.csv`;
  const filePath = path.resolve(__dirname, `${tmpLocalPath}/${fileName}`);

  const file = fs.createWriteStream(filePath, { flags: 'w' });
  const csvStream = format({ headers });

  csvStream.pipe(file).on('finish', process.exit);

  return { csvStream, filePath, fileName };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const writeStream = (csvStream: any, row: Record<string, unknown>) => {
  csvStream.write(row);

  return { csvStream };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const endStream = (csvStream: any) => {
  csvStream.end();

  return;
};
