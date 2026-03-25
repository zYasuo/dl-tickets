import { DomainError } from '../../../../common/errors/domain.error';

export class Name {
  static readonly MAX_LENGTH = 255;

  private constructor(readonly value: string) {}

  static create(raw: string): Name {
    if (typeof raw !== 'string') {
      throw new DomainError('Name must be a string');
    }

    const trimmed = raw.trim();

    if (!trimmed) {
      throw new DomainError('Name is required');
    }

    if (trimmed.length > Name.MAX_LENGTH) {
      throw new DomainError(`Name must be at most ${Name.MAX_LENGTH} characters`);
    }

    return new Name(trimmed);
  }

  equals(other: Name): boolean {
    return other instanceof Name && this.value === other.value;
  }
}
