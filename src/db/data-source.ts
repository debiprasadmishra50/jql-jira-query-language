import { DataSource } from "typeorm";
import "reflect-metadata";
import { join } from "path";

const myDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [`${__dirname}/../models/**/*.entity.ts`],
  migrations: [join(__dirname, "db", "migrations", "*{.ts,.js}")],
  migrationsRun: true,
  maxQueryExecutionTime: 1000,
  logging: true,
  logger: "file",
  synchronize: true,
  // dropSchema: true,
});

export const connect = myDataSource.initialize();
