import { DomainError } from 'src/common/errors/domain.error';
import { Description } from './description.vo';

describe('Description', () => {
  it('creates from trimmed non-empty string', () => {
    const d = Description.create('  hello  ');
    expect(d.value).toBe('hello');
  });

  it('throws when not a string', () => {
    expect(() => Description.create(null as unknown as string)).toThrow(DomainError);
  });

  it('throws when empty after trim', () => {
    expect(() => Description.create('   ')).toThrow(DomainError);
  });

  it('throws when longer than MAX_LENGTH', () => {
    expect(() => Description.create('x'.repeat(Description.MAX_LENGTH + 1))).toThrow(DomainError);
  });
});
