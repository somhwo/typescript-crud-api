// src/departments/department.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

export interface DepartmentAttributes {
  id: number;
  name: string;
  description: string;
}

export interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, 'id' | 'description'> {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
}

export default function initDepartmentModel(sequelize: Sequelize): typeof Department {
  Department.init(
    {
      id: {
        type:          DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        unique:    true,
      },
      description: {
        type:         DataTypes.STRING(500),
        allowNull:    false,
        defaultValue: '',
      },
    },
    {
      sequelize,
      modelName:  'Department',
      tableName:  'Departments',
      timestamps: false,
    },
  );

  return Department;
}
