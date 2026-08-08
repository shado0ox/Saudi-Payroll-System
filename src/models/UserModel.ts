import { db } from '../database/postgres';
import { User, Role } from '../types';

function mapUser(row: any): User {
  return {
    id: row.id,
    companyId: row.company_id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    status: row.status,
    refreshToken: row.refresh_token || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } as User;
}

function mapRole(row: any): Role {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    permissions: row.permissions || [],
    createdAt: row.created_at
  } as Role;
}

export class UserModel {

  static async findByUsernameOrEmail(
    identifier: string
  ): Promise<User | undefined> {

    const clean = identifier.trim().toLowerCase();

    const result = await db.query(
      `
      SELECT *
      FROM users
      WHERE LOWER(username) = $1
         OR LOWER(email) = $1
      LIMIT 1
      `,
      [clean]
    );

    return result.rows[0]
      ? mapUser(result.rows[0])
      : undefined;
  }


  static async findById(
    id: string
  ): Promise<User | undefined> {

    const result = await db.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );

    return result.rows[0]
      ? mapUser(result.rows[0])
      : undefined;
  }


  static async updateRefreshToken(
    userId: string,
    refreshToken: string | null
  ): Promise<void> {

    await db.query(
      `
      UPDATE users
      SET
        refresh_token = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [refreshToken, userId]
    );
  }


  static async findByRefreshToken(
    refreshToken: string
  ): Promise<User | undefined> {

    const result = await db.query(
      `
      SELECT *
      FROM users
      WHERE refresh_token = $1
      LIMIT 1
      `,
      [refreshToken]
    );

    return result.rows[0]
      ? mapUser(result.rows[0])
      : undefined;
  }


  static async getAllUsers(): Promise<User[]> {

    const result = await db.query(
      `SELECT * FROM users ORDER BY created_at DESC`
    );

    return result.rows.map(mapUser);
  }


  static async getAllRoles(): Promise<Role[]> {

    const result = await db.query(
      `SELECT * FROM roles ORDER BY name`
    );

    return result.rows.map(mapRole);
  }


  static async createUser(
    userData: any
  ): Promise<User> {

    const id = `usr-${Date.now()}`;

    const result = await db.query(
      `
      INSERT INTO users (
        id,
        company_id,
        username,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status,
        refresh_token
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
      `,
      [
        id,
        userData.companyId,
        userData.username,
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.role,
        userData.status || 'active',
        userData.refreshToken || null
      ]
    );

    return mapUser(result.rows[0]);
  }

  static async updateUser(
  id: string,
  updates: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    status?: 'active' | 'suspended';
  }
): Promise<User | null> {

  const current = await this.findById(id);

  if (!current) return null;

  const result = await db.query(
    `
    UPDATE users
    SET
      username = $1,
      email = $2,
      first_name = $3,
      last_name = $4,
      role = $5,
      status = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *
    `,
    [
      updates.username ?? current.username,
      updates.email ?? current.email,
      updates.firstName ?? current.firstName,
      updates.lastName ?? current.lastName,
      updates.role ?? current.role,
      updates.status ?? current.status,
      id
    ]
  );

  return result.rows[0]
    ? mapUser(result.rows[0])
    : null;
}


static async updatePassword(
  id: string,
  passwordHash: string
): Promise<boolean> {

  const result = await db.query(
    `
    UPDATE users
    SET
      password_hash = $1,
      refresh_token = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    `,
    [passwordHash, id]
  );

  return (result.rowCount ?? 0) > 0;
}


static async deleteUser(
  id: string
): Promise<boolean> {

  const result = await db.query(
    `
    DELETE FROM users
    WHERE id = $1
    `,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}


static async usernameOrEmailExists(
  username: string,
  email: string,
  excludeUserId?: string
): Promise<boolean> {

  const result = await db.query(
    `
    SELECT id
    FROM users
    WHERE (
      LOWER(username) = LOWER($1)
      OR LOWER(email) = LOWER($2)
    )
    AND ($3::text IS NULL OR id <> $3)
    LIMIT 1
    `,
    [
      username,
      email,
      excludeUserId || null
    ]
  );

  return result.rows.length > 0;
 }
}