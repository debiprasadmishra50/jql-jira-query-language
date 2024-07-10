import { DataSource } from "typeorm";

// custom-global.d.ts
declare global {
  namespace NodeJS {
    interface Global {
      dataSource: DataSource; // Replace `any` with the actual type of your variable
    }
  }
}
