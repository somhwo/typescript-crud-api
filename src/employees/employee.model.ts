// src/employees/employee.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

export interface EmployeeAttributes {
  id: number;
  employeeId: string;   // user-defined ID string e.g. "EMP-001"
  userEmail: string;    // links to a User account
  position: string;
  deptId: number;       // FK → Departments.id
  hireDate: string;     // stored as YYYY-MM-DD string
}

export interface EmployeeCreationAttributes
  extends Optional<EmployeeAttributes, 'id' | 'hireDate'> {}

export class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  public id!: number;
  public employeeId!: string;
  public userEmail!: string;
  public position!: string;
  public deptId!: number;
  public hireDate!: string;
}

export default function initEmployeeModel(sequelize: Sequelize): typeof Employee {
  Employee.init(
    {
      id: {
        type:          DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      employeeId: {
        type:      DataTypes.STRING(50),
        allowNull: false,
        unique:    true,
      },
      userEmail: {
        type:      DataTypes.STRING,
        allowNull: false,
      },
      position: {
        type:      DataTypes.STRING(100),
        allowNull: false,
      },
      deptId: {
        type:      DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      hireDate: {
        type:         DataTypes.STRING(20),
        allowNull:    false,
        defaultValue: '',
      },
    },
    {
      sequelize,
      modelName:  'Employee',
      tableName:  'Employees',
      timestamps: false,
    },
  );

  return Employee;
}
