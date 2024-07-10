import { EntityTarget, Repository } from "typeorm";

type EntityClass<Entity> = EntityTarget<Entity>;

export const getRepository = <Entity>(Entity: EntityClass<Entity>): Repository<Entity> => {
  return global.dataSource.getRepository(Entity);
};
