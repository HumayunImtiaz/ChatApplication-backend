import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('chat_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('chat_id').notNullable();
    table.uuid('user_id').notNullable();
    table.enum('role', ['admin', 'member']).notNullable().defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    
    table.foreign('chat_id').references('id').inTable('chats').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.unique(['chat_id', 'user_id']);
    
    table.index('chat_id');
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('chat_members');
}