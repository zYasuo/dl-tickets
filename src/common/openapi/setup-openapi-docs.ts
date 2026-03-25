import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
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
    .addTag('Users')
    .addTag('Tickets')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      StandardErrorResponseDto,
      UserPublicHttpOpenApiDto,
      UserCreatedEnvelopeOpenApiDto,
      TicketPublicHttpOpenApiDto,
      PaginationMetaOpenApiDto,
      TicketListInnerOpenApiDto,
      TicketListEnvelopeOpenApiDto,
      TicketSingleEnvelopeOpenApiDto,
    ],
  });

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
