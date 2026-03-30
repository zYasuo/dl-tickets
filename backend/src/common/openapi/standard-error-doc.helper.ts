import { ApiResponse } from '@nestjs/swagger';
import { StandardErrorResponseDto } from './standard-error-response.dto';

export function standardError(status: number, description: string) {
  return ApiResponse({
    status,
    description,
    type: StandardErrorResponseDto,
  });
}
