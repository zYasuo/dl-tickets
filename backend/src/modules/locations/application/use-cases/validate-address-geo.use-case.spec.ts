import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CITY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { ValidateAddressGeoUseCase } from './validate-address-geo.use-case';

const SP_STATE = '00000000-0000-4000-8000-000000000010';
const RJ_STATE = '00000000-0000-4000-8000-000000000011';
const SAO_PAULO_CITY = '00000000-0000-4000-8000-000000000020';

describe('ValidateAddressGeoUseCase', () => {
  let useCase: ValidateAddressGeoUseCase;
  let cities: jest.Mocked<Pick<CityRepositoryPort, 'findByUuidWithState'>>;

  beforeEach(async () => {
    cities = { findByUuidWithState: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateAddressGeoUseCase, { provide: CITY_REPOSITORY, useValue: cities }],
    }).compile();
    useCase = module.get(ValidateAddressGeoUseCase);
  });

  it('returns resolved labels when city belongs to state', async () => {
    cities.findByUuidWithState.mockResolvedValue({
      uuid: SAO_PAULO_CITY,
      name: 'São Paulo',
      state: { uuid: SP_STATE, name: 'São Paulo', code: 'SP' },
    });

    const out = await useCase.execute(SP_STATE, SAO_PAULO_CITY);

    expect(out).toEqual({
      stateUuid: SP_STATE,
      cityUuid: SAO_PAULO_CITY,
      cityName: 'São Paulo',
      stateCode: 'SP',
    });
  });

  it('throws when city is in another state', async () => {
    cities.findByUuidWithState.mockResolvedValue({
      uuid: SAO_PAULO_CITY,
      name: 'São Paulo',
      state: { uuid: SP_STATE, name: 'São Paulo', code: 'SP' },
    });

    await expect(useCase.execute(RJ_STATE, SAO_PAULO_CITY)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when city missing', async () => {
    cities.findByUuidWithState.mockResolvedValue(null);
    await expect(useCase.execute(SP_STATE, SAO_PAULO_CITY)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
