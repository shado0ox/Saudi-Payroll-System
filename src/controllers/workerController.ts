import { Request, Response, NextFunction } from 'express';
import { runPayrollWorkerJob } from '../../worker';
import { runMigrationScript } from '../../migrate';

export class WorkerController {
  static async triggerWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.body.period as string) || new Date().toISOString().substring(0, 7);
      const result = await runPayrollWorkerJob(period);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async triggerMigration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await runMigrationScript();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
