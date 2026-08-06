import { getDatabase, saveDatabase } from './db';
import { User, Role, UserRole } from '../types';

export class UserModel {
  static findByUsernameOrEmail(identifier: string): User | undefined {
    const db = getDatabase();
    const clean = identifier.trim().toLowerCase();
    return db.users.find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
  }

  static findById(id: string): User | undefined {
    const db = getDatabase();
    return db.users.find(u => u.id === id);
  }

  static updateRefreshToken(userId: string, refreshToken: string | null): void {
    const db = getDatabase();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].refreshToken = refreshToken || undefined;
      db.users[idx].updatedAt = new Date().toISOString();
      saveDatabase(db);
    }
  }

  static findByRefreshToken(refreshToken: string): User | undefined {
    const db = getDatabase();
    return db.users.find(u => u.refreshToken === refreshToken);
  }

  static getAllUsers(): User[] {
    const db = getDatabase();
    return db.users;
  }

  static getAllRoles(): Role[] {
    const db = getDatabase();
    return db.roles;
  }

  static createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const db = getDatabase();
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase(db);
    return newUser;
  }
}
