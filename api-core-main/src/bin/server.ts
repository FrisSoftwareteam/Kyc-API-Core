import 'reflect-metadata';
import path from 'path';
import express from 'express';
import * as awilix from 'awilix';
import { loadControllers, scopePerRequest } from 'awilix-express';
import bodyParser from 'body-parser';
import cors from 'cors';
// import dataSource from '../database/data.source';
import morganMiddleware from '../middlewares/morgan.middleware';
import { errors } from '../middlewares/errors';
import dotenv from 'dotenv';
import { config } from '../config';

let envPath = path.resolve(`${__dirname}/../.env`);

if (config.get('appEnv') === 'production') {
  envPath = path.resolve(`${__dirname}/../.env`);
} else if (config.get('appEnv') === 'staging') {
  envPath = path.resolve(`${__dirname}/../.env`);
}

dotenv.config({
  path: envPath,
});

import 'newrelic';
import newrelic from 'newrelic';
import logger from '../core/Logger';

class ServerComponent {
  private app: express.Express;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: any;
  private container: awilix.AwilixContainer;

  constructor({ container }: { container: awilix.AwilixContainer }) {
    this.app = express();
    this.container = container;
  }

  async start() {
    const { app, container } = this;

    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
    app.use(cors());
    app.use(morganMiddleware);
    // This will attach a scoped container on the context.
    app.use(scopePerRequest(container));

    app.use('/v1', loadControllers('../controllers/*{.ts,.js}', { cwd: __dirname }));

    app.use(errors);

    // catch 404 and forward to error handler
    app.get('/', (req, res) =>
      res.status(200).json({
        status: 200,
        message: 'Welcome to First Check!',
      }),
    );

    app.all('*', (req, res) =>
      res.status(404).json({
        status: 404,
        error: 'Endpoint does not exist',
      }),
    );

    this.server = app.listen(config.get('port'), () => {
      logger.info(`Server lauched successfully on port ${config.get('port')}`);
    });
  }

  async stop() {
    process.on('uncaughtException', (err, origin) => {
      newrelic.noticeError(err, { tag: origin });
    });

    process.on('SIGTERM', () => {
      this.server.close();
      process.kill(1);
    });
  }

  async register() {
    return this.app;
  }
}

export default async (container: awilix.AwilixContainer) => {
  return new ServerComponent({ container });
};
