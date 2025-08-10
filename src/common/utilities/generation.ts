import * as bcrypt from 'bcryptjs';

export class Generation {
  public static generateTimestampCode() {
    const timestamp = Date.now().toString();
    return timestamp;
  }

  public static encodePassword(rawPassword: string) {
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(rawPassword, salt);
  }

  public static comparePassword(rawPassword: string, hash: string) {
    return bcrypt.compareSync(rawPassword, hash);
  }
}
