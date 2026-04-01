import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { RateLimitGuard } from '../src/common/rate-limit/rate-limit.guard';
import { RateLimitModule } from '../src/common/rate-limit/rate-limit.module';
import { RateLimitRedisStore } from '../src/common/rate-limit/rate-limit-redis.store';
import { HttpExceptionFilter } from '../src/common/http/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/http/transform-response.interceptor';
import { rateLimitConfig } from '../src/config/rate-limit.config';
import { TOKEN_PROVIDER } from '../src/modules/auth/di.tokens';
import { JwtAuthGuard } from '../src/modules/auth/infrastructure/inbound/http/guards/jwt-auth.guard';
import { CityController } from '../src/modules/locations/infrastructure/inbound/http/controllers/city.controller';
import { CountryController } from '../src/modules/locations/infrastructure/inbound/http/controllers/country.controller';
import { StateController } from '../src/modules/locations/infrastructure/inbound/http/controllers/state.controller';
import { ListCountriesUseCase } from '../src/modules/locations/application/use-cases/list-countries.use-case';
import { FindCountryByIdUseCase } from '../src/modules/locations/application/use-cases/find-country-by-id.use-case';
import { CreateCountryUseCase } from '../src/modules/locations/application/use-cases/create-country.use-case';
import { UpdateCountryUseCase } from '../src/modules/locations/application/use-cases/update-country.use-case';
import { DeleteCountryUseCase } from '../src/modules/locations/application/use-cases/delete-country.use-case';
import { ListStatesByCountryUseCase } from '../src/modules/locations/application/use-cases/list-states-by-country.use-case';
import { FindStateByIdUseCase } from '../src/modules/locations/application/use-cases/find-state-by-id.use-case';
import { CreateStateUseCase } from '../src/modules/locations/application/use-cases/create-state.use-case';
import { UpdateStateUseCase } from '../src/modules/locations/application/use-cases/update-state.use-case';
import { DeleteStateUseCase } from '../src/modules/locations/application/use-cases/delete-state.use-case';
import { ListCitiesByStateUseCase } from '../src/modules/locations/application/use-cases/list-cities-by-state.use-case';
import { FindCityByIdUseCase } from '../src/modules/locations/application/use-cases/find-city-by-id.use-case';
import { CreateCityUseCase } from '../src/modules/locations/application/use-cases/create-city.use-case';
import { UpdateCityUseCase } from '../src/modules/locations/application/use-cases/update-city.use-case';
import { DeleteCityUseCase } from '../src/modules/locations/application/use-cases/delete-city.use-case';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return { count: c };
  }
}

describe('Locations require auth (e2e-style)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }), RateLimitModule],
      controllers: [CountryController, StateController, CityController],
      providers: [
        { provide: ListCountriesUseCase, useValue: { execute: jest.fn() } },
        { provide: FindCountryByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateCountryUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateCountryUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteCountryUseCase, useValue: { execute: jest.fn() } },
        { provide: ListStatesByCountryUseCase, useValue: { execute: jest.fn() } },
        { provide: FindStateByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateStateUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateStateUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteStateUseCase, useValue: { execute: jest.fn() } },
        { provide: ListCitiesByStateUseCase, useValue: { execute: jest.fn() } },
        { provide: FindCityByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateCityUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateCityUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteCityUseCase, useValue: { execute: jest.fn() } },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        {
          provide: TOKEN_PROVIDER,
          useValue: {
            verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')),
          },
        },
      ],
    })
      .overrideProvider(RateLimitRedisStore)
      .useValue(new MemoryRateLimitStore())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/countries without Authorization returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/countries').expect(401);
  });

  it('GET /api/v1/states without Authorization returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/states')
      .query({ countryUuid: '00000000-0000-4000-8000-000000000001' })
      .expect(401);
  });

  it('GET /api/v1/cities without Authorization returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/cities')
      .query({ stateUuid: '00000000-0000-4000-8000-000000000010' })
      .expect(401);
  });
});
