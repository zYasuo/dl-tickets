import { ArgumentMetadata, BadRequestException, Injectable, Optional } from '@nestjs/common';
import { createZodValidationPipe, type ZodDto } from 'nestjs-zod';
import { z, type ZodType, ZodError } from 'zod';
import { COMMON_API_ERROR_CODES } from '../errors/application';

const BaseZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown) => {
    if (error instanceof ZodError) {
      return new BadRequestException({
        message: 'Validation failed',
        code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
        errors: z.treeifyError(error),
      });
    }
    return new BadRequestException({
      message: 'Validation failed',
      code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
      errors: { errors: ['Invalid request'] },
    });
  },
});

@Injectable()
export class AppZodValidationPipe extends BaseZodValidationPipe {
  constructor(@Optional() schemaOrDto?: ZodDto | ZodType) {
    super(schemaOrDto);
  }

  override transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return super.transform(value, metadata);
    }

    let next = value;
    if (metadata.type === 'body') {
      if (next === undefined || next === null) {
        throw new BadRequestException({
          message: 'Validation failed',
          code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
          errors: {
            errors: ['Request body is empty or missing Content-Type: application/json header'],
          },
        });
      }
    } else if (next === undefined || next === null) {
      next = {};
    }

    return super.transform(next, metadata);
  }
}
