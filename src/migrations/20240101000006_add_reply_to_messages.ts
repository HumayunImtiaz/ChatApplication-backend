import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('messages', (table) => {
    table.uuid('reply_to').nullable();
    table.foreign('reply_to').references('id').inTable('messages').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('messages', (table) => {
    table.dropColumn('reply_to');
  });
}
