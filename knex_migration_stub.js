/*
* There are two functions within your newly created migration file.
* The first is exports.up, which specifies the commands that should be run
* to make the database change that you'd like to make. Usually you'll be
* running one or more commands found in the schema builder section of the
* Knex documentation. These are things like creating database tables,
* adding or removing a column from a table, changing indexes, etc.
*/
module.exports.up = async (db) => {}; // eslint-disable-line no-unused-vars

/*
* The second function within your migration file is exports.down. This functions
* goal is to do the opposite of what exports.up did. If exports.up created a
* table, then exports.down will drop that table. If exports.up added a column,
* then exports.down will remove that column. The reason to include exports.down
* is so that you can quickly undo a migration should you need to.
*/
module.exports.down = async (db) => {}; // eslint-disable-line no-unused-vars
