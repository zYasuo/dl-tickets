import { StateEntity } from '../../entities/state.entity';

export abstract class StateRepositoryPort {
  abstract create(entity: StateEntity): Promise<StateEntity>;
  abstract findByUuid(uuid: string): Promise<StateEntity | null>;
  abstract findByCountryUuid(countryUuid: string): Promise<StateEntity[]>;
  abstract update(entity: StateEntity): Promise<StateEntity>;
  abstract deleteByUuid(uuid: string): Promise<void>;
}
