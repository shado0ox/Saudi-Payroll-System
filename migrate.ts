import { resetAndSeedDatabase, getDatabase } from './src/models/db';
import { logger } from './src/utils/logger';

export async function runMigrationScript() {
  logger.info('🚀 Starting Database Migration & Seed script for payroll-system...');
  const start = Date.now();

  try {
    const db = resetAndSeedDatabase();
    
    logger.info(`✅ Migration Complete in ${Date.now() - start}ms.`);
    logger.info(`   - Initialized Company: "${db.config.companyName}"`);
    logger.info(`   - Populated Departments: ${db.departments.length}`);
    logger.info(`   - Seeded Active Employees: ${db.employees.length}`);
    logger.info(`   - Generated Attendance Records: ${db.attendance.length}`);

    return {
      status: 'success',
      message: 'Database schema and seed data successfully initialized.',
      durationMs: Date.now() - start,
      stats: {
        company: db.config.companyName,
        departmentsCount: db.departments.length,
        employeesCount: db.employees.length,
        attendanceRecordsCount: db.attendance.length
      }
    };
  } catch (err: any) {
    logger.error('❌ Migration Failed:', err);
    throw err;
  }
}

// If invoked directly from CLI (npm run migrate)
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationScript()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
