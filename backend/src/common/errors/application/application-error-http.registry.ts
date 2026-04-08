import { authApiErrorHttpMap } from 'src/modules/auth/application/errors/auth-api-error-http.map';
import { clientApiErrorHttpMap } from 'src/modules/clients/application/errors/client-api-error-http.map';
import { contractApiErrorHttpMap } from 'src/modules/client-contracts/application/errors/contract-api-error-http.map';
import { locationApiErrorHttpMap } from 'src/modules/locations/application/errors/location-api-error-http.map';
import { ticketApiErrorHttpMap } from 'src/modules/tickets/application/errors/ticket-api-error-http.map';
import { userApiErrorHttpMap } from 'src/modules/users/application/errors/user-api-error-http.map';
import type { ApplicationErrorHttpMeta } from './application-error-http.types';
import { commonApiErrorHttpMap } from './common-api-error-http.map';

const applicationErrorHttpRegistry: Record<string, ApplicationErrorHttpMeta> = {
  ...commonApiErrorHttpMap,
  ...authApiErrorHttpMap,
  ...userApiErrorHttpMap,
  ...clientApiErrorHttpMap,
  ...ticketApiErrorHttpMap,
  ...contractApiErrorHttpMap,
  ...locationApiErrorHttpMap,
};

export function resolveApplicationErrorHttp(code: string): ApplicationErrorHttpMeta | undefined {
  return applicationErrorHttpRegistry[code];
}
