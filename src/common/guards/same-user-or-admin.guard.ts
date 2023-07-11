import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from '../../users/users.service';
import { Reflector } from '@nestjs/core';
import { User } from 'src/users/entities/user.entity';
import { Roles } from '../enums/roles.enum';
import { AuthenticationError } from '@nestjs/apollo';

@Injectable()
export class SameUserOrAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // Returns an array of all the properties of an object seperated by a .
  getPropertiesArray(object: any): string[] {
    let result: string[] = [];
    Object.entries(object).forEach(([key, value]) => {
      const field = key;
      if (typeof value === 'object' && value !== null) {
        const objectProperties = this.getPropertiesArray(value).map(
          (prop) => `${field}.${prop}`,
        );
        result = result.concat(objectProperties);
      } else {
        result.push(field);
      }
    });
    return result;
  }

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    let shouldActivate = false;
    if (request.user) {
      const user = <User>request.user.payload;
      const args = ctx.getArgs();
      if (args.email && typeof args.email === 'string') {
        shouldActivate = args.email.toLowerCase() === user.email.toLowerCase();
      } else if (!args.email) {
        shouldActivate = true;
      }

      if (shouldActivate === false && user.roles.includes(Roles.ADMIN)) {
        const adminAllowedArgs = this.reflector.get<string[]>(
          'adminAllowedArgs',
          context.getHandler(),
        );

        shouldActivate = true;

        if (adminAllowedArgs) {
          const argFields = this.getPropertiesArray(args);
          argFields.forEach((field) => {
            if (!adminAllowedArgs.includes(field)) {
              throw new AuthenticationError(
                `Admin is not allowed to modify ${field}`,
              );
            }
          });
        }
      }
    }
    if (!shouldActivate) {
      throw new AuthenticationError('User does not have permissions');
    }
    return shouldActivate;
  }
}
