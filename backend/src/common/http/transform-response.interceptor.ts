import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { HttpSuccessEnvelope } from './http-contract.types';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<HttpSuccessEnvelope<unknown>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
