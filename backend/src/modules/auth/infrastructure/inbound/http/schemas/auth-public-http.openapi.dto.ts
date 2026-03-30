import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseOpenApiDto {
  @ApiProperty()
  accessToken!: string;
}

export class LoginEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: LoginResponseOpenApiDto })
  data!: LoginResponseOpenApiDto;
}

export class MessageResponseOpenApiDto {
  @ApiProperty()
  message!: string;
}

export class MessageEnvelopeOpenApiDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: MessageResponseOpenApiDto })
  data!: MessageResponseOpenApiDto;
}
