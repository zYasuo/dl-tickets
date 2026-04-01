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
