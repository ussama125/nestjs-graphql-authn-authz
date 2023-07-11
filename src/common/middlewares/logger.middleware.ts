import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Console } from 'console';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger(`HTTP`);
  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`Logging HTTP request `, `req:`, {
      host: req.headers.host,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.url,
      operationName: req.body.operationName,
      variables: req.body.variables,
      // query: req.body.query,
      params: req.params,
      originalUrl: req.originalUrl,
    });
    next();
  }
}
