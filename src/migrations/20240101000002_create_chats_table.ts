import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('chats', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255);
    table.enum('type', ['direct', 'group']).notNullable();
    table.uuid('created_by').notNullable();
    table.timestamps(true, true);
    
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    table.index('type');
    table.index('created_by');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('chats');
}