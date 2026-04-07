import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  USER_CREDENTIAL_REPOSITORY,
  USER_REPOSITORY,
} from 'src/modules/users/di.tokens';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { UserCredentialRepositoryPort } from 'src/modules/users/domain/ports/repository/user-credential.repository.port';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { LoginBody } from '../dto/login.dto';
import { randomUUID } from 'node:crypto';
import { SESSION_TOKEN_ISSUER } from '../../di.tokens';
import type {
  SessionTokenIssuerPort,
  SessionTokens,
} from '../../domain/ports/security/session-token-issuer.port';
import { ApplicationException } from 'src/common/errors/application';
import { AUTH_API_ERROR_CODES } from '../auth-api-error-codes';

const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=4$JMdI74dxqkC6ES1zzlG+rQ$O2PXX5Ze/TEmBGUuBZn5rpPghLhuoDNZXurwGg+CtGU';
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';
const ACCOUNT_LOCKED_MSG =
  'Too many failed sign-in attempts. This account is temporarily locked. Try again in a few minutes.';

export type LoginResult = SessionTokens;

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(USER_CREDENTIAL_REPOSITORY)
    private readonly credentialRepository: UserCredentialRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(SESSION_TOKEN_ISSUER)
    private readonly sessionTokenIssuer: SessionTokenIssuerPort,
  ) {}

  async execute(input: LoginBody): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      await this.passwordHasher.compare(input.password, DUMMY_HASH);
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.INVALID_CREDENTIALS,
        INVALID_CREDENTIALS_MSG,
      );
    }

    const internalId = await this.userRepository.getInternalIdByUuid(user.id);
    const credential = await this.credentialRepository.findByUserId(internalId);

    if (!credential) {
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.INVALID_CREDENTIALS,
        INVALID_CREDENTIALS_MSG,
      );
    }

    const now = Date.now();

    if (credential.lockedUntil) {
      if (credential.lockedUntil.getTime() > now) {
        throw new ApplicationException(AUTH_API_ERROR_CODES.ACCOUNT_LOCKED, ACCOUNT_LOCKED_MSG);
      }
      await this.credentialRepository.clearLoginLockout(internalId);
    }

    const passwordValid = await this.passwordHasher.compare(
      input.password,
      credential.passwordHash,
    );

    if (!passwordValid) {
      await this.credentialRepository.recordFailedLoginAttempt(internalId);
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.INVALID_CREDENTIALS,
        INVALID_CREDENTIALS_MSG,
      );
    }

    await this.credentialRepository.clearLoginLockout(internalId);

    if (!user.emailVerifiedAt) {
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.EMAIL_NOT_VERIFIED,
        'Complete email verification before signing in',
      );
    }

    return this.sessionTokenIssuer.issue({
      userUuid: user.id,
      email: user.email.value,
      internalUserId: internalId,
      familyId: randomUUID(),
    });
  }
}
