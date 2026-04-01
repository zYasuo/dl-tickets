import { ApiProperty } from '@nestjs/swagger';

export class ClientAddressOpenApiDto {
  @ApiProperty()
  street!: string;

  @ApiProperty()
  number!: string;

  @ApiProperty({ required: false })
  complement?: string;

  @ApiProperty()
  neighborhood!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ minLength: 2, maxLength: 2 })
  state!: string;

  @ApiProperty({ description: '8 digits' })
  zipCode!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  stateUuid!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  cityUuid!: string | null;
}

export class ClientPublicHttpOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  cpf!: string | null;

  @ApiProperty({ nullable: true })
  cnpj!: string | null;

  @ApiProperty({ type: ClientAddressOpenApiDto })
  address!: ClientAddressOpenApiDto;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class PaginationMetaOpenApiDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  hasNextPage!: boolean;

  @ApiProperty()
  hasPreviousPage!: boolean;

  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

export class ClientListInnerOpenApiDto {
  @ApiProperty({ type: [ClientPublicHttpOpenApiDto] })
  data!: ClientPublicHttpOpenApiDto[];

  @ApiProperty({ type: PaginationMetaOpenApiDto })
  meta!: PaginationMetaOpenApiDto;
}

export class ClientListEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: ClientListInnerOpenApiDto })
  data!: ClientListInnerOpenApiDto;
}

export class ClientSingleEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: ClientPublicHttpOpenApiDto })
  data!: ClientPublicHttpOpenApiDto;
}

export class ClientSearchMatchOpenApiDto {
  @ApiProperty({ enum: ['cpf', 'id', 'address'] })
  kind!: 'cpf' | 'id' | 'address';

  @ApiProperty({ enum: ['exact', 'partial'] })
  confidence!: 'exact' | 'partial';
}

export class ClientSearchRowOpenApiDto {
  @ApiProperty({ type: ClientPublicHttpOpenApiDto })
  client!: ClientPublicHttpOpenApiDto;

  @ApiProperty({ type: ClientSearchMatchOpenApiDto })
  match!: ClientSearchMatchOpenApiDto;
}

export class ClientSearchListInnerOpenApiDto {
  @ApiProperty({ type: [ClientSearchRowOpenApiDto] })
  data!: ClientSearchRowOpenApiDto[];

  @ApiProperty({ type: PaginationMetaOpenApiDto })
  meta!: PaginationMetaOpenApiDto;
}

export class ClientSearchListEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: ClientSearchListInnerOpenApiDto })
  data!: ClientSearchListInnerOpenApiDto;
}
