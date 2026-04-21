import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('chat_id').notNullable();
    table.uuid('inviter_id').notNullable();
    table.uuid('invitee_id').notNullable();
    table.enum('status', ['pending', 'accepted', 'rejected']).notNullable().defaultTo('pending');
    table.timestamps(true, true);
    
    table.foreign('chat_id').references('id').inTable('chats').onDelete('CASCADE');
    table.foreign('inviter_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('invitee_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.unique(['chat_id', 'invitee_id']);
    
    table.index('chat_id');
    table.index('inviter_id');
    table.index('invitee_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('invitations');
}