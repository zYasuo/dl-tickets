import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StandardErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ example: '2025-03-25T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiPropertyOptional()
  details?: unknown;
}
