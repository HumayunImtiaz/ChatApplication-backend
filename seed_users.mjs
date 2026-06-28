/**
 * Seed script to create 6 test users and 2 groups via the API.
 * Run: node seed_users.mjs
 */

const BASE_URL = 'http://localhost:5200/api/v1';

const users = [
  {
    username: 'Ayesha Khan',
    email: 'test1@gmail.com',
    password: '123456',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ayesha&backgroundColor=b6e3f4',
  },
  {
    username: 'Ahmed Raza',
    email: 'test2@gmail.com',
    password: '123456',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&backgroundColor=c0aede',
  },
  {
    username: 'Sara Ali',
    email: 'test3@gmail.com',
    password: '123456',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sara&backgroundColor=ffd5dc',
  },
  {
    username: 'Hassan Malik',
    email: 'test4@gmail.com',
    password: '123456',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Hassan&backgroundColor=d1d4f9',
  },
  {
    username: 'Fatima Noor',
    email: 'test5@gmail.com',
    password: '123456',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&backgroundColor=ffdfbf',
  },
  {
    username: 'Bilal Shah',
    email: 'test6@gmail.com',
    password: '123456',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bilal&backgroundColor=c1f0c1',
  },
];

async function post(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}

async function main() {
  console.log('========================================');
  console.log('  Seeding 6 Users');
  console.log('========================================\n');

  const registeredUsers = [];

  for (const user of users) {
    console.log(`Registering ${user.username} (${user.email})...`);
    const res = await post(`${BASE_URL}/users/register`, user);
    if (res.success) {
      console.log(`  ✅ Registered! ID: ${res.data?.user?.id || 'N/A'}`);
      registeredUsers.push({
        id: res.data?.user?.id,
        username: user.username,
        token: res.data?.token,
      });
    } else {
      console.log(`  ❌ Failed: ${res.message || JSON.stringify(res)}`);
      // Try logging in if user already exists
      console.log(`  🔄 Trying login instead...`);
      const loginRes = await post(`${BASE_URL}/users/login`, {
        email: user.email,
        password: user.password,
      });
      if (loginRes.success) {
        console.log(`  ✅ Logged in! ID: ${loginRes.data?.user?.id || 'N/A'}`);
        registeredUsers.push({
          id: loginRes.data?.user?.id,
          username: user.username,
          token: loginRes.data?.token,
        });
      } else {
        console.log(`  ❌ Login also failed: ${loginRes.message || JSON.stringify(loginRes)}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('  Registered Users Summary');
  console.log('========================================');
  registeredUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.username} — ID: ${u.id}`);
  });

  if (registeredUsers.length < 6) {
    console.log('\n⚠️  Not all users were created. Skipping group creation.');
    return;
  }

  // Create groups using the first user's token (test1 - Ayesha Khan)
  const creatorToken = registeredUsers[0].token;

  console.log('\n========================================');
  console.log('  Creating Groups');
  console.log('========================================\n');

  // Group 1: test1, test2, test3
  const group1Members = [registeredUsers[1].id, registeredUsers[2].id];
  console.log(`Creating "Dev Team Alpha" with: ${registeredUsers[0].username}, ${registeredUsers[1].username}, ${registeredUsers[2].username}`);
  const g1 = await post(
    `${BASE_URL}/chats/group`,
    {
      name: 'Dev Team Alpha',
      member_ids: group1Members,
      avatar: 'https://api.dicebear.com/9.x/identicon/svg?seed=DevTeamAlpha&backgroundColor=b6e3f4',
    },
    creatorToken
  );
  if (g1.success) {
    console.log(`  ✅ Group "Dev Team Alpha" created! ID: ${g1.data?.id || 'N/A'}`);
  } else {
    console.log(`  ❌ Failed: ${g1.message || JSON.stringify(g1)}`);
  }

  // Group 2: test4, test5, test6 — created by test4
  const creator2Token = registeredUsers[3].token;
  const group2Members = [registeredUsers[4].id, registeredUsers[5].id];
  console.log(`Creating "Project Beta" with: ${registeredUsers[3].username}, ${registeredUsers[4].username}, ${registeredUsers[5].username}`);
  const g2 = await post(
    `${BASE_URL}/chats/group`,
    {
      name: 'Project Beta',
      member_ids: group2Members,
      avatar: 'https://api.dicebear.com/9.x/identicon/svg?seed=ProjectBeta&backgroundColor=ffd5dc',
    },
    creator2Token
  );
  if (g2.success) {
    console.log(`  ✅ Group "Project Beta" created! ID: ${g2.data?.id || 'N/A'}`);
  } else {
    console.log(`  ❌ Failed: ${g2.message || JSON.stringify(g2)}`);
  }

  console.log('\n========================================');
  console.log('  ✨ Seeding Complete!');
  console.log('========================================');
  console.log('\nLogin credentials for all users:');
  console.log('  Email: test1@gmail.com ... test6@gmail.com');
  console.log('  Password: 123456');
}

main().catch(console.error);
