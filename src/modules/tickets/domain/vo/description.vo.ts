import { DomainError } from 'src/common/errors/domain.error';

export class Description {
  static readonly MAX_LENGTH = 255;

  private constructor(readonly value: string) {}

  static create(raw: string): Description {
    if (typeof raw !== 'string') {
      throw new DomainError('Description must be a string');
    }

    const trimmed = raw.trim();

    if (!trimmed) {
      throw new DomainError('Description is required');
    }

    if (trimmed.length > Description.MAX_LENGTH) {
      throw new DomainError(`Description must be at most ${Description.MAX_LENGTH} characters`);
    }

    return new Description(trimmed);
  }
}
