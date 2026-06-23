import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

export class PasswordHelper {
  static async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `${hash.toString("hex")}.${salt}`;
  }

  static async compare(password: string, storedHash: string): Promise<boolean> {
    const [hash, salt] = storedHash.split(".");
    if (!hash || !salt) {
      return false;
    }
    const compareHash = (await scrypt(password, salt, 64)) as Buffer;
    return compareHash.toString("hex") === hash;
  }
}
