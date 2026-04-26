You are a senior backend engineer. Build a **production-ready REST API backend** for a "Koda app".

## ⚙️ Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Zod (validation)
- JWT (auth)
- bcrypt (password hashing)
- Cloudinary (image upload)
- multer (file handling)
- dotenv

---

## 📁 Project Structure

backend/

- controllers/
- routes/
- models/
- validators/
- middlewares/
- services/
- utils/
- config/
- server.js

---

## 👤 USER MODEL

Fields:

- name (string, required)
- username (string, required, unique, lowercase, indexed)
- email (string, required, unique)
- password (hashed)
- institution (string, required)
- year (string/number, required)
- bio (string)
- avatar (Cloudinary URL)
- isPublic (boolean, default true)
- followers (array of userIds)
- following (array of userIds)
- totalPoints (number, default 0)
- level (string, default "Beginner")
- createdAt, updatedAt (timestamps)

---

## 🔐 AUTH SYSTEM

### Endpoints:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/me
- PUT /api/users/update
- POST /api/users/avatar

### Features:

- Zod validation
- bcrypt hashing
- JWT token generation
- auth middleware

---

## 🔍 USER SEARCH

Endpoint:

- GET /api/users/search?query=abc

Features:

- search by username (partial, case-insensitive)
- exclude current user
- limit 10 results
- return safe fields only

---

## 👥 FOLLOW SYSTEM

Endpoints:

- POST /api/users/:id/follow
- POST /api/users/:id/unfollow

Logic:

- update followers/following arrays
- prevent duplicates

---

## 📚 SUBJECT SYSTEM

### Subject Model:

- userId
- title
- color
- isPublic
- createdAt

Endpoints:

- POST /api/subjects
- GET /api/subjects
- PUT /api/subjects/:id
- DELETE /api/subjects/:id

---

## 📖 CHAPTER SYSTEM

### Chapter Model:

- subjectId
- title
- isCompleted
- createdAt

Endpoints:

- POST /api/chapters
- GET /api/chapters/:subjectId
- PUT /api/chapters/:id

---

## ⏱️ STUDY SESSION

### Model:

- userId
- subjectId
- chapterId
- duration (minutes)
- date
- createdAt

Endpoints:

- POST /api/sessions
- GET /api/sessions

---

## 🔥 STREAK SYSTEM

Logic:

- increase streak if daily session exists
- reset if missed

Store in user:

- currentStreak
- longestStreak

---

## 💬 DOUBT SYSTEM

### Doubt Model:

- userId
- subjectId
- chapterId
- title
- description
- image
- isSolved
- solvedBy
- createdAt

### Reply Model:

- doubtId
- userId
- text
- upvotes
- isAccepted
- createdAt

Endpoints:

- POST /api/doubts
- GET /api/doubts
- POST /api/replies
- PUT /api/replies/:id/upvote
- PUT /api/replies/:id/accept

---

## 🎖️ POINTS SYSTEM

Points:

- Study session → +5
- Chapter complete → +10
- Reply → +5
- Upvote → +3
- Accepted answer → +10

### points_history:

- userId
- actionType
- points
- createdAt

Logic:

- update totalPoints in user
- update level automatically

---

## 🏆 LEADERBOARD

Endpoints:

- GET /api/leaderboard
- GET /api/leaderboard/weekly

Sort users by totalPoints

---

## ☁️ CLOUDINARY

- upload avatar
- store URL in DB
- use multer

---

## 🧪 ZOD VALIDATION

Create schemas for:

- register
- login
- subject
- chapter
- session
- doubt
- reply
- search query

Use middleware:
validateRequest(schema)

---

## 🔐 MIDDLEWARE

- authMiddleware (JWT verify)
- validateRequest (Zod)
- errorHandler

---

## ⚡ BEST PRACTICES

- MVC architecture
- async/await
- MongoDB indexing (username, email)
- do not expose sensitive fields
- modular code

---

## 📦 RESPONSE FORMAT

Success:
{
success: true,
data: {}
}

Error:
{
success: false,
message: "Error message"
}

---

## 🚀 OUTPUT REQUIRED

Provide:

1. Full backend code (models, controllers, routes)
2. Zod schemas
3. Middleware
4. Cloudinary setup
5. JWT implementation
6. Example API requests/responses

Ensure:

- Clean architecture
- Scalable code
- Production-ready
- No missing features
