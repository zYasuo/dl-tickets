import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

export type UserPublicHttp = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export function toUserPublicHttp(user: UserEntity): UserPublicHttp {
  return {
    id: user.id,
    name: user.name.value,
    email: user.email.value,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
