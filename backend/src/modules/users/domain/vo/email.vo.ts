import { DomainError } from '../../../../common/errors/domain.error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  static readonly MAX_LENGTH = 254;

  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    if (typeof raw !== 'string') {
      throw new DomainError('Email must be a string');
    }

    const trimmed = raw.trim().toLowerCase();

    if (!trimmed) {
      throw new DomainError('Email is required');
    }

    if (trimmed.length > Email.MAX_LENGTH) {
      throw new DomainError(`Email must be at most ${Email.MAX_LENGTH} characters`);
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      throw new DomainError('Email format is invalid');
    }

    return new Email(trimmed);
  }

  equals(other: Email): boolean {
    return other instanceof Email && this.value === other.value;
  }
}
