import type { InjectionToken } from '@nestjs/common';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { UserCredentialRepositoryPort } from 'src/modules/users/domain/ports/repository/user-credential.repository.port';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { EmailVerificationChallengeRepositoryPort } from 'src/modules/users/domain/ports/repository/email-verification-challenge.repository.port';
import type { EmailVerificationCodeHasherPort } from 'src/modules/users/domain/ports/security/email-verification-code-hasher.port';

export const USER_REPOSITORY: InjectionToken<UserRepositoryPort> = Symbol('USER_REPOSITORY');

export const USER_CREDENTIAL_REPOSITORY: InjectionToken<UserCredentialRepositoryPort> = Symbol(
  'USER_CREDENTIAL_REPOSITORY',
);

export const PASSWORD_HASHER: InjectionToken<PasswordHasherPort> = Symbol('PASSWORD_HASHER');

export const EMAIL_VERIFICATION_CHALLENGE_REPOSITORY: InjectionToken<EmailVerificationChallengeRepositoryPort> =
  Symbol('EMAIL_VERIFICATION_CHALLENGE_REPOSITORY');

export const EMAIL_VERIFICATION_CODE_HASHER: InjectionToken<EmailVerificationCodeHasherPort> =
  Symbol('EMAIL_VERIFICATION_CODE_HASHER');
