import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from 'src/modules/tickets/domain/entities/ticket.entity';

export class TicketPublicHttpOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: TicketStatus })
  status!: TicketStatus;

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

export class TicketListInnerOpenApiDto {
  @ApiProperty({ type: [TicketPublicHttpOpenApiDto] })
  data!: TicketPublicHttpOpenApiDto[];

  @ApiProperty({ type: PaginationMetaOpenApiDto })
  meta!: PaginationMetaOpenApiDto;
}

export class TicketListEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: TicketListInnerOpenApiDto })
  data!: TicketListInnerOpenApiDto;
}

export class TicketSingleEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: TicketPublicHttpOpenApiDto })
  data!: TicketPublicHttpOpenApiDto;
}
