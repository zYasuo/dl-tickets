import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { StandardErrorResponseDto } from './standard-error-response.dto';
import {
  UserCreatedEnvelopeOpenApiDto,
  UserPublicHttpOpenApiDto,
} from '../../modules/users/infrastructure/inbound/http/schemas/user-public-http.openapi.dto';
import {
  PaginationMetaOpenApiDto,
  TicketListEnvelopeOpenApiDto,
  TicketListInnerOpenApiDto,
  TicketPublicHttpOpenApiDto,
  TicketSingleEnvelopeOpenApiDto,
} from '../../modules/tickets/infrastructure/inbound/http/schemas/ticket-public-http.openapi.dto';
import {
  LoginEnvelopeOpenApiDto,
  LoginResponseOpenApiDto,
  MessageEnvelopeOpenApiDto,
  MessageResponseOpenApiDto,
} from '../../modules/auth/infrastructure/inbound/http/schemas/auth-public-http.openapi.dto';
import { OPENAPI_ACCESS_TOKEN_SCHEME } from './openapi-access-token-scheme.constant';

export type SetupOpenApiDocsOptions = {
  title: string;
  description: string;
  version: string;
};

export function setupOpenApiDocs(app: INestApplication, options: SetupOpenApiDocsOptions): void {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version)
    .addServer('/api/v1', 'Versioned API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT from `POST /auth/login` (`data.accessToken`). Payload: `sub` (user uuid), `email`. Refresh: httpOnly cookie + `POST /auth/refresh`.',
      },
      OPENAPI_ACCESS_TOKEN_SCHEME,
    )
    .addTag('Auth', 'Sign-in, refresh (cookie), logout, password reset')
    .addTag('Users', 'Registration (public)')
    .addTag('Tickets', 'List / create / update — requires Bearer token')
    .addTag('Clients', 'List / create / detail — requires Bearer token')
    .addTag('Client contracts', 'List / create / update / detail — requires Bearer token')
    .build();

  const rawDocument = SwaggerModule.createDocument(app, config, {
    extraModels: [
      StandardErrorResponseDto,
      UserPublicHttpOpenApiDto,
      UserCreatedEnvelopeOpenApiDto,
      TicketPublicHttpOpenApiDto,
      PaginationMetaOpenApiDto,
      TicketListInnerOpenApiDto,
      TicketListEnvelopeOpenApiDto,
      TicketSingleEnvelopeOpenApiDto,
      LoginResponseOpenApiDto,
      LoginEnvelopeOpenApiDto,
      MessageResponseOpenApiDto,
      MessageEnvelopeOpenApiDto,
    ],
  });

  const document = cleanupOpenApiDoc(rawDocument, { version: 'auto' });

  SwaggerModule.setup('docs', app, document, {
    swaggerUiEnabled: false,
    raw: ['json'],
    jsonDocumentUrl: 'docs-json',
  });

  app.use(
    '/docs',
    apiReference({
      content: document,
    }),
  );
}
