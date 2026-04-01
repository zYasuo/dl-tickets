import { ApiProperty } from '@nestjs/swagger';
import { ClientAddressOpenApiDto } from 'src/modules/clients/infrastructure/inbound/http/schemas/client-public-http.openapi.dto';

export class ClientContractPublicHttpOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  contractNumber!: string;

  @ApiProperty({ format: 'uuid' })
  clientId!: string;

  @ApiProperty()
  useClientAddress!: boolean;

  @ApiProperty({ type: ClientAddressOpenApiDto, nullable: true })
  address!: ClientAddressOpenApiDto | null;

  @ApiProperty({ format: 'date' })
  startDate!: string;

  @ApiProperty({ format: 'date', nullable: true })
  endDate!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] })
  status!: string;

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

export class ClientContractListInnerOpenApiDto {
  @ApiProperty({ type: [ClientContractPublicHttpOpenApiDto] })
  data!: ClientContractPublicHttpOpenApiDto[];

  @ApiProperty({ type: PaginationMetaOpenApiDto })
  meta!: PaginationMetaOpenApiDto;
}

export class ClientContractListEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: ClientContractListInnerOpenApiDto })
  data!: ClientContractListInnerOpenApiDto;
}

export class ClientContractSingleEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: ClientContractPublicHttpOpenApiDto })
  data!: ClientContractPublicHttpOpenApiDto;
}
