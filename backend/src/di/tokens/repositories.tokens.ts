import type { InjectionToken } from '@nestjs/common';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { TicketRepositoryPort } from 'src/modules/tickets/domain/ports/repository/ticket.repository.port';
import type { RefreshTokenRepositoryPort } from 'src/modules/auth/domain/ports/repository/refresh-token.repository.port';
import type { PasswordResetRepositoryPort } from 'src/modules/auth/domain/ports/repository/password-reset.repository.port';
import type { NotificationRepositoryPort } from 'src/modules/notifications/domain/ports/repository/notification.repository.port';

export const USER_REPOSITORY: InjectionToken<UserRepositoryPort> =
  Symbol('USER_REPOSITORY');

export const TICKET_REPOSITORY: InjectionToken<TicketRepositoryPort> =
  Symbol('TICKET_REPOSITORY');

export const REFRESH_TOKEN_REPOSITORY: InjectionToken<RefreshTokenRepositoryPort> =
  Symbol('REFRESH_TOKEN_REPOSITORY');

export const PASSWORD_RESET_REPOSITORY: InjectionToken<PasswordResetRepositoryPort> =
  Symbol('PASSWORD_RESET_REPOSITORY');

export const NOTIFICATION_REPOSITORY: InjectionToken<NotificationRepositoryPort> =
  Symbol('NOTIFICATION_REPOSITORY');
