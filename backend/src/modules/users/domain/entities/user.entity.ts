import { DomainError } from '../../../../common/errors/domain.error';
import { Email } from '../vo/email.vo';
import { Name } from '../vo/name.vo';
import { Password } from '../vo/password.vo';

export type TUserEntity = {
  id: string;
  name: Name;
  email: Email;
  password: Password;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateUserEntityInput = Omit<TUserEntity, 'email' | 'name' | 'password'> & {
  name: string;
  password: string;
  email: string;
};

export class UserEntity {
  constructor(private readonly params: TUserEntity) {}

  get id(): string {
    return this.params.id;
  }

  get name(): Name {
    return this.params.name;
  }

  get email(): Email {
    return this.params.email;
  }

  get password(): Password {
    return this.params.password;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get updatedAt(): Date {
    return this.params.updatedAt;
  }

  static create(input: TCreateUserEntityInput): UserEntity {
    if (!input.id?.trim()) {
      throw new DomainError('Id is required');
    }

    const email = Email.create(input.email);
    const name = Name.create(input.name);
    const password = Password.create(input.password);

    return new UserEntity({
      ...input,
      email,
      name,
      password,
    });
  }
}
