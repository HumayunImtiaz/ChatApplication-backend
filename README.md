# Chat Application Backend

A professional real-time chat application backend built with TypeScript, Express.js, Socket.io, Knex, and PostgreSQL.

## 🚀 Features

- ✅ **User Authentication** - JWT-based authentication with secure password hashing
- ✅ **One-to-One Chat** - Send invitations and chat directly with other users
- ✅ **Group Chat** - Create groups, invite members, and chat together
- ✅ **Real-time Messaging** - Instant message delivery using Socket.io
- ✅ **Message Status** - Track sent, delivered, and read status
- ✅ **Online/Offline Status** - See who's online in real-time
- ✅ **Typing Indicators** - Know when someone is typing
- ✅ **Invitation System** - Send and respond to chat invitations
- ✅ **Professional Architecture** - MVC pattern with services, controllers, and validators
- ✅ **Type Safety** - Fully typed with TypeScript
- ✅ **Database Migrations** - Managed with Knex.js

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the Repository

```bash
cd chat-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL Database

#### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Open pgAdmin 4 (installed with PostgreSQL)
5. Create a new database named `chat_db`:
   - Right-click on "Databases" → Create → Database
   - Name: `chat_db`
   - Click Save

#### macOS:
```bash
brew install postgresql
brew services start postgresql
createdb chat_db
```

#### Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb chat_db
```

### 4. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 5. Run Database Migrations

This will create all the necessary tables in your database:

```bash
npm run migrate:latest
```

## 🚀 Running the Application

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript to JavaScript
npm run build

# Start the production server
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
chat-backend/
├── src/
│   ├── config/          # Database and app configuration
│   │   ├── database.ts
│   │   └── knexfile.ts
│   ├── controllers/     # Request handlers
│   │   ├── chatController.ts
│   │   ├── invitationController.ts
│   │   ├── messageController.ts
│   │   └── userController.ts
│   ├── middlewares/     # Express middlewares
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── migrations/      # Database migrations
│   │   ├── 20240101000001_create_users_table.ts
│   │   ├── 20240101000002_create_chats_table.ts
│   │   ├── 20240101000003_create_chat_members_table.ts
│   │   ├── 20240101000004_create_messages_table.ts
│   │   └── 20240101000005_create_invitations_table.ts
│   ├── routes/          # API routes
│   │   ├── chatRoutes.ts
│   │   ├── invitationRoutes.ts
│   │   ├── messageRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   ├── chatService.ts
│   │   ├── invitationService.ts
│   │   ├── messageService.ts
│   │   └── userService.ts
│   ├── socket/          # Socket.io handlers
│   │   └── index.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── auth.ts
│   │   └── response.ts
│   ├── validators/      # Joi validation schemas
│   │   └── index.ts
│   └── server.ts        # Main server file
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Database Schema

### Tables

1. **users** - User accounts
   - id, username, email, password, avatar, is_online, last_seen

2. **chats** - Chat rooms (direct or group)
   - id, name, type, created_by

3. **chat_members** - Users in chats
   - id, chat_id, user_id, role (admin/member)

4. **messages** - All messages
   - id, chat_id, sender_id, content, status (sent/delivered/read)

5. **invitations** - Pending/accepted/rejected invitations
   - id, chat_id, inviter_id, invitee_id, status

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/logout` - Logout user
- `GET /api/v1/users/profile` - Get current user profile
- `GET /api/v1/users/search?query=name` - Search users
- `GET /api/v1/users/all` - Get all users

### Chats
- `POST /api/v1/chats/direct` - Create direct chat (send invitation)
- `POST /api/v1/chats/group` - Create group chat
- `GET /api/v1/chats` - Get user's chats
- `GET /api/v1/chats/:chatId` - Get chat details
- `POST /api/v1/chats/invite` - Invite user to group

### Messages
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/:chatId` - Get chat messages
- `PATCH /api/v1/messages/status` - Update message status
- `PATCH /api/v1/messages/:chatId/read` - Mark all as read

### Invitations
- `GET /api/v1/invitations` - Get user's invitations
- `POST /api/v1/invitations/respond` - Accept/reject invitation

## 🔌 Socket.io Events

### Client → Server
- `chat:join` - Join a chat room
- `chat:leave` - Leave a chat room
- `message:send` - Send a message
- `message:status` - Update message status
- `message:read-all` - Mark all messages as read
- `typing:start` - Start typing
- `typing:stop` - Stop typing

### Server → Client
- `user:online` - User online/offline status
- `message:new` - New message received
- `message:status-updated` - Message status updated
- `message:all-read` - All messages marked as read
- `typing:user-typing` - User is typing
- `typing:user-stopped` - User stopped typing
- `invitation:received` - New invitation received
- `invitation:responded` - Invitation response

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing the API

You can test the API using tools like:
- **Postman**
- **Thunder Client** (VS Code extension)
- **curl**

Example registration request:

```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | chat_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Token expiration | 7d |
| CORS_ORIGIN | Allowed origin | http://localhost:3000 |

## 🛠️ Database Commands

```bash
# Run latest migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

## 📦 Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **Knex.js** - SQL query builder
- **PostgreSQL** - Database
- **Joi** - Validation
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Chat Application Backend - Professional Real-time Chat System

## 🙏 Support

For support, email your-email@example.com or create an issue in the repository.
