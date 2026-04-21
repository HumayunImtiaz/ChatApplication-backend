import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('chat_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.text('content').notNullable();
    table.enum('status', ['sent', 'delivered', 'read']).notNullable().defaultTo('sent');
    table.timestamps(true, true);
    
    table.foreign('chat_id').references('id').inTable('chats').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.index('chat_id');
    table.index('sender_id');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('messages');
}