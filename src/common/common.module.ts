import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { ConfigModule } from './config.module';
import { GraphqlModule } from './graphql.module';
import { MongoModule } from './mongo.module';

@Module({
  imports: [ConfigModule, GraphqlModule, MongoModule, AuthModule],
  exports: [ConfigModule, GraphqlModule, MongoModule, AuthModule],
})
export class CommonModule {}
