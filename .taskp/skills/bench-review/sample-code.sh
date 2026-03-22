#!/usr/bin/env bash
set -euo pipefail

cat << 'TYPESCRIPT'
// user-service.ts
import { db } from "./database";

export class UserService {
  async createUser(name: string, email: string, age: number) {
    if (name == "") {
      throw new Error("name is required");
    }

    const existing = await db.query("SELECT * FROM users WHERE email = '" + email + "'");
    if (existing.length > 0) {
      return null;
    }

    const user = await db.query(
      `INSERT INTO users (name, email, age, created_at) VALUES ('${name}', '${email}', ${age}, NOW()) RETURNING *`
    );

    console.log("User created: " + user[0].id);

    await this.sendWelcomeEmail(email, name);

    return user[0];
  }

  private async sendWelcomeEmail(email: string, name: string) {
    try {
      const response = await fetch("https://api.email.com/send", {
        method: "POST",
        body: JSON.stringify({
          to: email,
          subject: "Welcome!",
          body: "Hi " + name + ", welcome to our platform!",
        }),
      });
    } catch (e) {
      // ignore email errors
    }
  }

  async deleteUser(id: number) {
    await db.query("DELETE FROM users WHERE id = " + id);
    await db.query("DELETE FROM posts WHERE user_id = " + id);
    await db.query("DELETE FROM comments WHERE user_id = " + id);
  }

  async getUsers(page: any, limit: any) {
    const offset = (page - 1) * limit;
    const users = await db.query(
      `SELECT * FROM users ORDER BY id LIMIT ${limit} OFFSET ${offset}`
    );
    return users;
  }

  async updateUserAge(id: number, age: number) {
    if (age < 0 || age > 200) {
      throw new Error("invalid age");
    }
    await db.query(`UPDATE users SET age = ${age} WHERE id = ${id}`);
  }
}
TYPESCRIPT
