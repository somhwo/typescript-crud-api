// src/users/user.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';
import { Role } from '../_helpers/role';

export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  title: string;
  firstName: string;
  lastName: string;
  role: Role;
  verified: boolean;   // ← new: must verify before login
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'verified' | 'createdAt' | 'updatedAt'> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: Role;
  public verified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function initUserModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type:          DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      email: {
        type:      DataTypes.STRING,
        allowNull: false,
        unique:    true,
        validate:  { isEmail: true },
      },
      passwordHash: {
        type:      DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type:      DataTypes.STRING(20),
        allowNull: false,
      },
      firstName: {
        type:      DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type:      DataTypes.STRING(100),
        allowNull: false,
      },
      role: {
        type:         DataTypes.ENUM(...Object.values(Role)),
        allowNull:    false,
        defaultValue: Role.User,
      },
      verified: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,   // users start unverified
      },
      createdAt: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type:         DataTypes.DATE,
        allowNull:    false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withHash: { attributes: { include: ['passwordHash'] } },
      },
    },
  );

  return User;
}
