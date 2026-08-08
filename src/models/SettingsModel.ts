import { db } from '../database/postgres';
import { SystemConfig } from '../types';
import { defaultConfig } from '../config';

export class SettingsModel {

  /**
   * Get company payroll settings.
   *
   * If the company has no saved settings yet,
   * create them from defaultConfig.
   */
  static async getConfig(
    companyId: string
  ): Promise<SystemConfig> {

    const result = await db.query(
      `
      SELECT config
      FROM system_settings
      WHERE company_id = $1
      LIMIT 1
      `,
      [companyId]
    );

    if (result.rows[0]) {
      return result.rows[0].config as SystemConfig;
    }

    /*
     * First use for this company:
     * create its own independent settings.
     */
    const initialConfig: SystemConfig = {
      ...defaultConfig,
      updatedAt: new Date().toISOString()
    };

    const inserted = await db.query(
      `
      INSERT INTO system_settings (
        company_id,
        config,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )

      ON CONFLICT (company_id)
      DO UPDATE SET
        config = system_settings.config

      RETURNING config
      `,
      [
        companyId,
        JSON.stringify(initialConfig)
      ]
    );

    return inserted.rows[0].config as SystemConfig;
  }


  /**
   * Update company payroll settings.
   *
   * Existing settings are merged
   * with submitted values.
   */
  static async updateConfig(
    companyId: string,
    updates: Partial<SystemConfig>
  ): Promise<SystemConfig> {

    const current =
      await this.getConfig(companyId);

    const updatedConfig: SystemConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const result = await db.query(
      `
      INSERT INTO system_settings (
        company_id,
        config,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )

      ON CONFLICT (company_id)
      DO UPDATE SET
        config = EXCLUDED.config,
        updated_at = CURRENT_TIMESTAMP

      RETURNING config
      `,
      [
        companyId,
        JSON.stringify(updatedConfig)
      ]
    );

    return result.rows[0].config as SystemConfig;
  }
}