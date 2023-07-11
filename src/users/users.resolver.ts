import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { LoggedUserOutput } from './dto/logged-user.output';
import { LoginUserInput } from './dto/login-user.input';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { Roles } from 'src/common/enums/roles.enum';
import { UserInputError, ValidationError } from '@nestjs/apollo';
import { AdminAllowedArgs } from 'src/common/decorators/admin-allowed-args';
import { SameUserOrAdminGuard } from 'src/common/guards/same-user-or-admin.guard';

@Resolver(() => User)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => LoggedUserOutput)
  loginUser(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
  ): Promise<LoggedUserOutput> {
    return this.usersService.loginUser(loginUserInput);
  }

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    let createdUser: User | undefined;
    try {
      createdUser = await this.usersService.create(createUserInput);
    } catch (error) {
      this.logger.error('Create user error: ', error);
      throw new UserInputError(error.message);
    }
    return createdUser;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Query(() => [User], { name: 'users' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, SameUserOrAdminGuard)
  @Query(() => User, { name: 'user' })
  async findOne(@Args('email') email: string): Promise<User> {
    let user: User | undefined;

    if (!email) {
      throw new UserInputError('A username or email must be included');
    } else {
      user = await this.usersService.findOneByEmail(email);
    }

    if (user) return user;
    throw new UserInputError('The user does not exist');
  }

  @Mutation(() => User)
  @AdminAllowedArgs(
    'email',
    'updateUserInput.email',
    'updateUserInput.firstName',
    'updateUserInput.lastName',
  )
  @UseGuards(JwtAuthGuard, SameUserOrAdminGuard)
  async updateUser(
    @Args('email') email: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @Context('req') request: any,
  ): Promise<User> {
    if (!email && request.user) email = request.user.payload.email;
    let user: User;

    try {
      user = await this.usersService.update(email, updateUserInput);
    } catch (error) {
      throw new ValidationError(error.message);
    }

    if (!user) throw new UserInputError('The user does not exist');

    return user;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Mutation(() => User)
  removeUser(@Args('email') email: string): Promise<User> {
    return this.usersService.remove(email);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async addAdminRole(@Args('email') email: string): Promise<User> {
    const user = await this.usersService.addRole(Roles.ADMIN, email);
    if (!user) throw new UserInputError('The user does not exist');
    return user;
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removeAdminRole(@Args('email') email: string): Promise<User> {
    const user = await this.usersService.removeRole(Roles.ADMIN, email);
    if (!user) throw new UserInputError('The user does not exist');
    return user;
  }
}
