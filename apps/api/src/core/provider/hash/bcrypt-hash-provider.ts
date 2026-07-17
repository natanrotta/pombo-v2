import { injectable } from "tsyringe";
import bcrypt from "bcrypt";
import { IHashProvider } from "@shared/provider";

@injectable()
export class BcryptHashProvider implements IHashProvider {
  private readonly SALT_ROUNDS = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
