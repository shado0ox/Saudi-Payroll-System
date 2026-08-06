import { getDatabase, saveDatabase } from './db';
import { AttendanceRecord } from '../types';

export class AttendanceModel {
  static getForPeriod(period: string): AttendanceRecord[] {
    const db = getDatabase();
    return db.attendance.filter(a => a.period === period);
  }

  static getByEmployeeAndPeriod(employeeId: string, period: string): AttendanceRecord | undefined {
    const db = getDatabase();
    return db.attendance.find(a => a.employeeId === employeeId && a.period === period);
  }

  static upsert(record: Omit<AttendanceRecord, 'id' | 'updatedAt'> & { id?: string }): AttendanceRecord {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existingIndex = db.attendance.findIndex(
      a => a.employeeId === record.employeeId && a.period === record.period
    );

    if (existingIndex >= 0) {
      const updated: AttendanceRecord = {
        ...db.attendance[existingIndex],
        ...record,
        updatedAt: now
      };
      db.attendance[existingIndex] = updated;
      saveDatabase(db);
      return updated;
    } else {
      const newRecord: AttendanceRecord = {
        ...record,
        id: record.id || `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        updatedAt: now
      };
      db.attendance.push(newRecord);
      saveDatabase(db);
      return newRecord;
    }
  }
}
