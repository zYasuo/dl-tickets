import { CityEntity } from '../../entities/city.entity';

export type CityWithStateSnapshot = {
  uuid: string;
  name: string;
  state: {
    uuid: string;
    name: string;
    code: string | null;
  };
};

export abstract class CityRepositoryPort {
  abstract create(entity: CityEntity): Promise<CityEntity>;
  abstract findByUuid(uuid: string): Promise<CityEntity | null>;
  abstract findByUuidWithState(uuid: string): Promise<CityWithStateSnapshot | null>;
  abstract findByStateUuid(stateUuid: string): Promise<CityEntity[]>;
  abstract update(entity: CityEntity): Promise<CityEntity>;
  abstract deleteByUuid(uuid: string): Promise<void>;
}
