/**
 * Full Setup Script:
 * - Login as Ayesha Khan (test1) — the MAIN admin user
 * - Get ALL users from the database
 * - Send direct chat invitations to every user
 * - Create 2 groups with all users
 * - Auto-accept ALL invitations from each user's side
 * 
 * Result: When Ayesha logs in, she sees all personal chats + 2 groups fully populated.
 */

const BASE_URL = 'http://localhost:5200/api/v1';

// All test user credentials
const allTestUsers = [
  { email: 'test1@gmail.com', password: '123456', name: 'Ayesha Khan' },
  { email: 'test2@gmail.com', password: '123456', name: 'Ahmed Raza' },
  { email: 'test3@gmail.com', password: '123456', name: 'Sara Ali' },
  { email: 'test4@gmail.com', password: '123456', name: 'Hassan Malik' },
  { email: 'test5@gmail.com', password: '123456', name: 'Fatima Noor' },
  { email: 'test6@gmail.com', password: '123456', name: 'Bilal Shah' },
];

async function apiCall(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

const post = (url, body, token) => apiCall('POST', url, body, token);
const get = (url, token) => apiCall('GET', url, null, token);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Full Chat Setup — Ayesha Khan (Admin)     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ─────────────────────────────────────────────────
  // STEP 1: Login all users and collect tokens + IDs
  // ─────────────────────────────────────────────────
  console.log('━━━ STEP 1: Logging in all users ━━━\n');

  const loggedInUsers = [];

  for (const user of allTestUsers) {
    const res = await post(`${BASE_URL}/users/login`, {
      email: user.email,
      password: user.password,
    });

    if (res.success) {
      loggedInUsers.push({
        id: res.data.user.id,
        username: res.data.user.username,
        email: user.email,
        token: res.data.token,
      });
      console.log(`  ✅ ${user.name} logged in — ID: ${res.data.user.id}`);
    } else {
      console.log(`  ❌ ${user.name} login failed: ${res.message}`);
    }
  }

  if (loggedInUsers.length < 2) {
    console.log('\n⚠️  Not enough users logged in. Exiting.');
    return;
  }

  const mainUser = loggedInUsers[0]; // Ayesha Khan
  const otherUsers = loggedInUsers.slice(1);

  console.log(`\n  👑 Main User: ${mainUser.username} (${mainUser.id})`);
  console.log(`  👥 Other Users: ${otherUsers.map(u => u.username).join(', ')}\n`);

  // ─────────────────────────────────────────────────
  // STEP 2: Also get any OTHER users from the DB that are not test users
  // ─────────────────────────────────────────────────
  console.log('━━━ STEP 2: Fetching all users from database ━━━\n');

  const allUsersRes = await get(`${BASE_URL}/users/all`, mainUser.token);
  let allDbUsers = [];
  if (allUsersRes.success) {
    allDbUsers = allUsersRes.data || [];
    console.log(`  📋 Found ${allDbUsers.length} other users in database`);
    allDbUsers.forEach(u => console.log(`     • ${u.username} (${u.id})`));
  } else {
    console.log(`  ⚠️  Could not fetch users: ${allUsersRes.message}`);
  }

  // Combine: all DB users that are NOT the main user
  const targetUserIds = new Set();
  const targetUsers = [];

  // Add test users (we have tokens for them)
  for (const u of otherUsers) {
    if (!targetUserIds.has(u.id)) {
      targetUserIds.add(u.id);
      targetUsers.push(u);
    }
  }

  // Add any DB users we don't already have (we won't have tokens for them,
  // but we can still send invites from Ayesha's side)
  for (const u of allDbUsers) {
    if (u.id !== mainUser.id && !targetUserIds.has(u.id)) {
      targetUserIds.add(u.id);
      targetUsers.push({
        id: u.id,
        username: u.username,
        email: u.email,
        token: null, // We don't have their token
      });
    }
  }

  console.log(`\n  🎯 Total users to connect with: ${targetUsers.length}\n`);

  // ─────────────────────────────────────────────────
  // STEP 3: Send direct chat invitations from Ayesha to ALL users
  // ─────────────────────────────────────────────────
  console.log('━━━ STEP 3: Creating direct chats (personal invites) ━━━\n');

  const directChatResults = [];

  for (const user of targetUsers) {
    console.log(`  📨 Inviting ${user.username} for direct chat...`);
    const res = await post(
      `${BASE_URL}/chats/direct`,
      { invitee_id: user.id },
      mainUser.token
    );
    if (res.success) {
      console.log(`     ✅ Invitation sent! Chat: ${res.data?.chatId}, Invitation: ${res.data?.invitationId}`);
      directChatResults.push({
        userId: user.id,
        username: user.username,
        chatId: res.data?.chatId,
        invitationId: res.data?.invitationId,
      });
    } else {
      console.log(`     ⚠️  ${res.message}`);
    }
    await sleep(200); // Small delay to avoid overwhelming
  }

  // ─────────────────────────────────────────────────
  // STEP 4: Create 2 groups with ALL users
  // ─────────────────────────────────────────────────
  console.log('\n━━━ STEP 4: Creating 2 groups ━━━\n');

  const allTargetIds = targetUsers.map(u => u.id);

  // Group 1: "Team Developers "
  console.log('  📁 Creating Group: "Team Developers 🚀"...');
  const g1 = await post(
    `${BASE_URL}/chats/group`,
    {
      name: 'Team Developers 🚀',
      member_ids: allTargetIds,
      avatar: 'https://api.dicebear.com/9.x/identicon/svg?seed=TeamDevelopers&backgroundColor=b6e3f4',
    },
    mainUser.token
  );

  let group1Id = null;
  let group1InvitationIds = [];
  if (g1.success) {
    group1Id = g1.data?.chatId;
    group1InvitationIds = g1.data?.invitationIds || [];
    console.log(`     ✅ Created! ID: ${group1Id}`);
    console.log(`     📨 ${group1InvitationIds.length} invitations sent`);
  } else {
    console.log(`     ❌ Failed: ${g1.message}`);
  }

  await sleep(300);

  // Group 2: "General Chat 💬"
  console.log('  📁 Creating Group: "General Chat 💬"...');
  const g2 = await post(
    `${BASE_URL}/chats/group`,
    {
      name: 'General Chat 💬',
      member_ids: allTargetIds,
      avatar: 'https://api.dicebear.com/9.x/identicon/svg?seed=GeneralChat&backgroundColor=ffd5dc',
    },
    mainUser.token
  );

  let group2Id = null;
  let group2InvitationIds = [];
  if (g2.success) {
    group2Id = g2.data?.chatId;
    group2InvitationIds = g2.data?.invitationIds || [];
    console.log(`     ✅ Created! ID: ${group2Id}`);
    console.log(`     📨 ${group2InvitationIds.length} invitations sent`);
  } else {
    console.log(`     ❌ Failed: ${g2.message}`);
  }

  // ─────────────────────────────────────────────────
  // STEP 5: Auto-accept ALL invitations from each user's side
  // ─────────────────────────────────────────────────
  console.log('\n━━━ STEP 5: Auto-accepting all invitations ━━━\n');

  for (const user of otherUsers) {
    if (!user.token) {
      console.log(`  ⏭️  Skipping ${user.username} — no token available`);
      continue;
    }

    // Get this user's pending invitations
    const invRes = await get(`${BASE_URL}/invitations`, user.token);

    if (!invRes.success) {
      console.log(`  ❌ Could not fetch invitations for ${user.username}: ${invRes.message}`);
      continue;
    }

    const invitations = invRes.data || [];
    console.log(`  👤 ${user.username}: ${invitations.length} pending invitations`);

    for (const inv of invitations) {
      const typeLabel = inv.chat_type === 'group' ? `Group: ${inv.chat_name}` : 'Direct Chat';
      console.log(`     ✅ Accepting: ${typeLabel} (from ${inv.inviter_username})`);
      const acceptRes = await post(
        `${BASE_URL}/invitations/respond`,
        { invitation_id: inv.id, accept: true },
        user.token
      );
      if (!acceptRes.success) {
        console.log(`        ⚠️  ${acceptRes.message}`);
      }
      await sleep(100);
    }
  }

  // ─────────────────────────────────────────────────
  // STEP 6: Summary
  // ─────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║            ✨ SETUP COMPLETE ✨              ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  👑 Main User: ${mainUser.username.padEnd(29)}║`);
  console.log(`║  📧 Email: ${mainUser.email.padEnd(33)}║`);
  console.log(`║  🔑 Password: 123456                        ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  💬 Direct Chats: ${String(directChatResults.length).padEnd(26)}║`);
  console.log(`║  👥 Groups: 2                                ║`);
  console.log(`║     • Team Developers                     ║`);
  console.log(`║     • General Chat 💬                        ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  All invitations have been auto-accepted!   ║');
  console.log('║  Login as Ayesha to see everything ready.   ║');
  console.log('╚══════════════════════════════════════════════╝\n');
}

main().catch(console.error);
