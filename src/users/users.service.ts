import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/common/services/auth.service';
import { LoginUserInput } from './dto/login-user.input';
import { MongoError } from 'mongodb';
import { Roles } from 'src/common/enums/roles.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<User> {
    createUserInput.password = await this.getCryptedPassword(
      createUserInput.password,
    );

    const user = new this.userModel(createUserInput);
    user.roles = [Roles.USER];
    let savedUser;

    try {
      savedUser = await user.save();
    } catch (error) {
      throw this.evaluateMongoError(error, createUserInput);
    }
    return savedUser;
  }

  findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({ _id: id }).exec();
    if (!user) {
      this.logger.log(`User ${id} not found`);
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(email: string, updateUserInput: UpdateUserInput): Promise<User> {
    const fields: any = {};
    const existingUser = await this.findOneByEmail(email);

    if (existingUser) {
      this.logger.log('Existing User: ', existingUser);
      updateUserInput.email = undefined;
    }

    if (updateUserInput.password) {
      updateUserInput.password = await this.getCryptedPassword(
        updateUserInput.password,
      );
    }

    // Remove undefined keys for update
    for (const key in updateUserInput) {
      if (typeof updateUserInput[key] !== 'undefined' && key !== 'password') {
        fields[key] = updateUserInput[key];
      }
    }

    this.logger.log('Fields to be updated: ', fields);

    let user: User | undefined | null = null;

    if (Object.entries(updateUserInput).length > 0) {
      user = await this.userModel.findOneAndUpdate(
        { email: email.toLowerCase() },
        fields,
        { new: true, runValidators: true },
      );
    } else {
      user = await this.findOneByEmail(email);
    }

    if (!user) return undefined;

    return user;
  }

  async remove(email: string) {
    this.logger.log(`Removing user with email: ${email}`);
    const user = await this.findOneByEmail(email);
    return user.deleteOne();
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel.findOne({ email: email }).exec();
    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }
    return user;
  }

  async loginUser(loginUserInput: LoginUserInput) {
    const user = await this.authService.validateUser(
      loginUserInput.email,
      loginUserInput.password,
    );

    if (!user) {
      this.logger.error('Error: Incorrect email, or password');
      throw new BadRequestException(`Incorrect email or password`);
    } else {
      return this.authService.generateUserCredentials(user);
    }
  }

  async addRole(role: string, email: string): Promise<User | undefined> {
    const user = await this.findOneByEmail(email);
    if (!user) return undefined;
    if (user.roles.includes(role)) return user;
    user.roles.push(role);
    await user.save();
    this.logger.log(`Added admin role to user: ${email}`);
    return user;
  }

  async removeRole(role: string, email: string): Promise<User | undefined> {
    const user = await this.findOneByEmail(email);
    if (!user) return undefined;
    user.roles = user.roles.filter((r) => r !== role);
    await user.save();
    this.logger.log(`Removed admin role from user: ${email}`);
    return user;
  }

  private evaluateMongoError(
    error: MongoError,
    createUserInput: CreateUserInput,
  ): Error {
    if (error.code === 11000) {
      if (
        error.message
          .toLowerCase()
          .includes(createUserInput.email.toLowerCase())
      ) {
        this.logger.error('Duplicate email: ', createUserInput.email);
        throw new Error(`Email ${createUserInput.email} is already registered`);
      }
    }
    this.logger.error('Error: ', error);
    throw new Error(error.message);
  }

  private getCryptedPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(password, saltOrRounds);
  }
}
