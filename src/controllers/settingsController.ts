import { Request, Response, NextFunction } from 'express';
import { getDatabase, saveDatabase } from '../models/db';

export class SettingsController {
  static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDatabase();
      res.json({ success: true, data: db.config });
    } catch (err) {
      next(err);
    }
  }

  static async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDatabase();
      db.config = {
        ...db.config,
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      db.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'UPDATE_SYSTEM_CONFIG',
        user: 'Admin',
        details: 'Updated global payroll tax brackets and social security rates.',
        module: 'Settings'
      });

      saveDatabase(db);
      res.json({ success: true, data: db.config });
    } catch (err) {
      next(err);
    }
  }
}
