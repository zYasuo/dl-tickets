import { CountryEntity } from '../../entities/country.entity';

export abstract class CountryRepositoryPort {
  abstract create(entity: CountryEntity): Promise<CountryEntity>;
  abstract findByUuid(uuid: string): Promise<CountryEntity | null>;
  abstract findAll(): Promise<CountryEntity[]>;
  abstract update(entity: CountryEntity): Promise<CountryEntity>;
  abstract deleteByUuid(uuid: string): Promise<void>;
}
