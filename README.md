# nestjs-graphql-authn-authz

If this project helps you, please add a star! If you see an issue, please post it!

This project uses NestJS, GraphQL, and MongoDB.

This project implements user authentication and authorization. It will be easy to add other GraphQL schemas following the same structure.

The intent of this project is to provide an example of how to integrate all of these technologies together that are in the NestJS documentation (NestJS, GraphQL, MongoDB, Mongoose, Passport, JWT) into a working backend. If you recognize an anti-pattern or a better way to do something, please post an issue.

## Getting Started

### Create .env file

Add a `.env` file to the root of your project.

```env
MONGODB_URL=mongodb+srv://techverx-dev-1:i37uELmqQ1u141zt@techverx.oucr0qf.mongodb.net/nest_auth?retryWrites=true&w=majority
JWT_SECRET = mYtX32charact3RultrA$tronG$3cr3T
JWT_EXPIRES_IN=86400s
```

#### Required Parameters

`MONGO_URI` the location of your mongo server and database name you want. Use the MONGO_URL provided to use the MongoDB ATLAS as db.

`JWT_SECRET` a secret string used to make the keys. Create a random string.

`JWT_EXPIRES_IN` Seconds until token expires. If not set, there will be no expiration.

### Start the server

`npm install`

`npm run start`

That's it, the graphQL playground is found at `http://localhost:3000/graphql`

## Users

Add a user via the graphql playground or a frontend. See example mutations and queries below.

Update that user's Document to have the string `admin` in the permissions array. Only an admin can add another admin, so the first user must be done manually. MongoDB Compass is a great tool to modify fields. That user can now add the admin permission or remove the admin permission to or from other users.

The `UsersService` `update` method will update any fields which are valid and not duplicates, even if other fields are invalid or duplicates.

Users can change their `email` or `password`, via a mutation. Changing their email will make their token unusable (it won't authenticate when the user presenting the token's email is checked against the token's email).

Because unique property `email` can be changed, `_id` should be used as keys for relationships.

A super ADMIN has already been added to database used. If you are using your own database you need to add one maunally. (PS: I know I need to create database migration for it)

```
#SUPER ADMIN
email: ussama.zubair@techverx.com
password: 123
```

## Authentication and Authorization

To SignUp use following mutation

```graphql
mutation CreateUser($createUserInput: CreateUserInput!) {
  createUser(createUserInput: $createUserInput) {
    _id
    firstName
    lastName
    email
    roles
  }
}
```

```json
{
  "createUserInput": {
    "firstName": "First",
    "lastName": "Last",
    "email": "you@email.com",
    "password": "123"
  }
}
```

Once signed up use the email/password to log in:

```graphql
mutation LoginUser($loginCredentials1: LoginUserInput!) {
  loginUser(loginUserInput: $loginCredentials1) {
    access_token
  }
}
```

```json
{
  "loginCredentials": {
    "email": "your@email.com",
    "password": "123"
  }
}
```

You will receive an access_token on successful login:

```json
{
  "data": {
    "loginUser": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjFAdHguY29tIiwiZmlyc3ROYW1lIjoiVXBkYXRlZCIsImxhc3ROYW1lIjoiVXBkYXRlZCIsInJvbGVzIjpbInVzZXIiXSwic3ViIjoiNjQzN2U1MTNjM2M5NDJkZWEwMjdlMDczIiwiaWF0IjoxNjgxNDU2NzQ0LCJleHAiOjE2ODE1NDMxNDR9.yhKJRbUs4gej49o9y9ytAo-XcTbehKq1h47R9ww3q5g"
    }
  }
}
```

Add the token to your headers `{"Authorization": "Bearer eyj2aGc..."}` to be authenticated via the `JwtAuthGuard`.

Users can modify or view their own data. Admins can do anything except refresh another user's token or change their password, which would allow the admin to impersonate that user.

The `AdminGuard` checks weather the current logged in user has admin permissions or not.

The `SameUserOrAdminGuard` is the same as the `AdminGuard` except it also allows the users to access their own records. Admins should not be allowed to change everything. For example, an admin should not be allowed to set another user's password. This would allow the admin to impersonate that user. The `@AdminAllowedArgs` decorator has been added for this reason to this guard.

```Typescript
@AdminAllowedArgs(
    'username',
    'fieldsToUpdate.username',
    'fieldsToUpdate.email',
    'fieldsToUpdate.enabled',
  )
```

The `JwtAuthGuard` ensures that there is a valid JWT and that the user associated with the JWT exists in the database.

To assign or remove admin permissions use following graphql mutations after logging in by an admin

```graphql
mutation AddRole {
  addAdminRole(email: "1@tx.com") {
    email, roles
  }
}
```

```graphql
mutation RemoveRole {
  removeAdminRole(email: "1@tx.com") {
    email, roles
  }
}
```

## Next tasks

Add email verification when a user registers.
Password reset and Frogot password

## Other GraphQL Playground Examples

```graphql
query getUsers {
  users {
    _id, firstName, lastName, email, roles
  }
}

```

```graphql
query getUser {
  user(email: "2@tx.com") {
    _id, firstName, lastName, email, roles
  }
}
```

```graphql
mutation UpdateUser($updateUserInput: UpdateUserInput!) {
  updateUser(email: "2@tx.com", updateUserInput: $updateUserInput) {
    _id, firstName, lastName, email, roles
  }
}
```

```json
{
  "updateUserInput": {
    "firstName": "Updated",
    "lastName": "Updated"
  },
}
```
