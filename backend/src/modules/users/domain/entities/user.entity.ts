import { DomainError } from '../../../../common/errors/domain.error';
import { Email } from '../vo/email.vo';
import { Name } from '../vo/name.vo';

export type UserEntityProps = {
  id: string;
  name: Name;
  email: Email;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserEntityInput = Omit<UserEntityProps, 'email' | 'name' | 'emailVerifiedAt'> & {
  name: string;
  email: string;
  emailVerifiedAt?: Date | null;
};

export class UserEntity {
  constructor(private readonly params: UserEntityProps) {}

  get id(): string {
    return this.params.id;
  }

  get name(): Name {
    return this.params.name;
  }

  get email(): Email {
    return this.params.email;
  }

  get emailVerifiedAt(): Date | null {
    return this.params.emailVerifiedAt;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get updatedAt(): Date {
    return this.params.updatedAt;
  }

  static create(input: CreateUserEntityInput): UserEntity {
    if (!input.id?.trim()) {
      throw new DomainError('Id is required');
    }

    const email = Email.create(input.email);
    const name = Name.create(input.name);

    return new UserEntity({
      ...input,
      email,
      name,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
    });
  }
}
