// src/requests/request.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';
import type { RequestItem, RequestStatus, RequestType } from '../types';

export interface RequestAttributes {
  id: number;
  employeeEmail: string;
  type: RequestType;
  items: RequestItem[];   // stored as JSON
  status: RequestStatus;
  date: string;           // YYYY-MM-DD
}

export interface RequestCreationAttributes
  extends Optional<RequestAttributes, 'id' | 'status' | 'date'> {}

export class Request
  extends Model<RequestAttributes, RequestCreationAttributes>
  implements RequestAttributes
{
  public id!: number;
  public employeeEmail!: string;
  public type!: RequestType;
  public items!: RequestItem[];
  public status!: RequestStatus;
  public date!: string;
}

export default function initRequestModel(sequelize: Sequelize): typeof Request {
  Request.init(
    {
      id: {
        type:          DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      employeeEmail: {
        type:      DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type:      DataTypes.ENUM('Equipment', 'Leave', 'Resources'),
        allowNull: false,
      },
      items: {
        type:      DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type:         DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull:    false,
        defaultValue: 'Pending',
      },
      date: {
        type:      DataTypes.STRING(20),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName:  'Request',
      tableName:  'Requests',
      timestamps: false,
    },
  );

  return Request;
}
