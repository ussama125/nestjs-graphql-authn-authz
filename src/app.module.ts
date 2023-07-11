import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from 'nestjs-pino';
import { MiddlewareConsumer } from '@nestjs/common/interfaces/middleware';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';

@Module({
  imports: [
    CommonModule,
    UsersModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        redact: ['request.headers.authorization'],
        transport: {
          targets: [
            {
              level: 'info',
              target: 'pino-pretty',
              options: {
                singleLine: true,
                messageFormat: '{req.headers.x-request-id} [{context}] {msg}',
                ignore: 'pid,hostname,context,req,res.headers,user.password',
                errorLikeObjectKeys: ['err', 'error'],
              },
            },
            {
              level: 'info',
              target: 'pino/file',
              options: {
                destination: `./app.log`,
                // streams: {},
                singleLine: true,
                messageFormat: '{req.headers.x-request-id} [{context}] {msg}',
                ignore: 'pid,hostname,context,req,res.headers,user.password',
                errorLikeObjectKeys: ['err', 'error'],
              },
            },
            // {
            //   level: 'error',
            //   target: 'pino/file',
            //   options: {
            //     destination: `./error.log`,
            //     singleLine: true,
            //     messageFormat: '{req.headers.x-request-id} [{context}] {msg}',
            //     ignore: 'pid,hostname,context,req,res.headers,user.password',
            //     errorLikeObjectKeys: ['err', 'error']
            //   }
            // }
          ],
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
