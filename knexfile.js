module.exports = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'postgres',
    database: 'ticker'
  },
  migrations: {
    tableName: 'knex_migrations',
    stub: './knex_migration_stub.js'
  }
};