// src/users/user.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';
import { Role } from '../_helpers/role';

// ─── Attribute interfaces ─────────────────────────────────────────────────────

/** All columns that exist on the `Users` table. */
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  title: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fields that are optional when creating a new record.
 * `id`, `createdAt`, and `updatedAt` are auto-managed by Sequelize.
 */
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// ─── Model class ─────────────────────────────────────────────────────────────

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
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// ─── Model initializer ────────────────────────────────────────────────────────

/**
 * Initialises the User model on the given Sequelize instance and returns
 * the class (not an instance) so it can be stored on the `db` object.
 */
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

      // Default queries exclude the password hash for safety.
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },

      // Use `.scope('withHash')` when the hash is explicitly needed.
      scopes: {
        withHash: { attributes: { include: ['passwordHash'] } },
      },
    },
  );

  return User;
}
