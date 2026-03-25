import { DomainError } from '../../../../common/errors/domain.error';

export class Password {
  static readonly MIN_LENGTH = 8;
  static readonly MAX_LENGTH = 255;

  private constructor(readonly value: string) {}

  static create(raw: string): Password {
    if (typeof raw !== 'string') {
      throw new DomainError('Password must be a string');
    }

    if (!raw) {
      throw new DomainError('Password is required');
    }

    if (raw.length < Password.MIN_LENGTH) {
      throw new DomainError(`Password must be at least ${Password.MIN_LENGTH} characters`);
    }

    if (raw.length > Password.MAX_LENGTH) {
      throw new DomainError(`Password must be at most ${Password.MAX_LENGTH} characters`);
    }

    return new Password(raw);
  }
}
