import { AuthenticationError } from '@nestjs/apollo';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from '../../users/users.service';
import { Roles } from '../enums/roles.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    if (request.user) {
      const roles = request.user.payload.roles;
      this.logger.log('User roles: ', roles);

      return !!roles.includes(Roles.ADMIN);
    }

    throw new AuthenticationError('User does not have permissions');
  }
}
