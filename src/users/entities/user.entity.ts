import { ObjectType, Field } from '@nestjs/graphql';
import { Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
@ObjectType()
export class User {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId | string;

  @Prop()
  @Field(() => String, { description: 'User firstName ' })
  firstName: string;

  @Prop()
  @Field(() => String, { description: 'User lastName ' })
  lastName: string;

  @Prop({ unique: true })
  @Field(() => String, { description: 'User email ' })
  email: string;

  @Prop()
  @Field(() => [String], { description: 'User roles' })
  roles: string[];

  @Prop()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
