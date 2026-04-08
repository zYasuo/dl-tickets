export const USER_API_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'USER_EMAIL_ALREADY_EXISTS',
  NOT_FOUND: 'USER_NOT_FOUND',
} as const;

export type UserApiErrorCode = (typeof USER_API_ERROR_CODES)[keyof typeof USER_API_ERROR_CODES];
