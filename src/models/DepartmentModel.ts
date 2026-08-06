import { getDatabase } from './db';
import { Department } from '../types';

export class DepartmentModel {
  static getAll(): Department[] {
    const db = getDatabase();
    return db.departments;
  }
}
