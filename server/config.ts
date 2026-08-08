export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || "3023", 10),
  host: "0.0.0.0",
  env: process.env.NODE_ENV || "development",
  dbFilePath: "./data/payroll_db.json",
};