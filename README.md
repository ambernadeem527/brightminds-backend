# BrightMinds API Engine — Online Tuition & Tutor Matching Platform
 
Welcome to the **BrightMinds API Engine**, a secure REST API backend microservice built to
manage tuition matchmaking, student user accounts, instructor directory rosters, and calendar
lesson booking logs for 6th to 10th-grade tutorial tracks.
 
## 🚀 Core Technology Stack Features
 
* **Runtime Layer Engine:** Node.js (LTS Version)
* **Application Framework:** Express.js
* **Data Storage Matrix:** PostgreSQL Relational Database Engine
* **Driver Layer Suite:** `pg` / `pg.Pool` (asynchronous connection pooling client)
* **Password Security Matrix:** `bcryptjs` (one-way salted cryptographic hashing)
* **Session Authorization Grid:** `jsonwebtoken` (stateless signed Bearer web tokens)
* **Local Workspace Testing Engine:** VS Code REST Client extension
 
## 🛠️ System Directory Architecture Maps
 
* `/server.js` - Application entry point: mounts every route and the global error handler.
* `/config/db.js` - Connection pool bridge connecting to the local SQL instance.
* `/middleware/auth.js` - Identity verification filter and tiered role authorization guard.
* `/middleware/errorHandler.js` - Central exception filter that keeps the app running.
* `/routes/users.js` - Controls account creation, user logins, and profile retrieval.
* `/routes/tutors.js` - Controls instructor directory search and tutor profile onboarding.
* `/routes/bookings.js` - Controls calendar booking creation and status updates.
* `/schema.sql` - Database table build script.
* `/api-test.http` - REST Client integration test script.
 
## ⚙️ Local Deployment & Installation Steps
 
1. **Clone the repository onto your system and open it inside VS Code:**
 
```bash
git clone <your-repository-url>
cd brightminds-backend
npm install
```
 
2. **Configure Local Environment Settings:**
 
Create a file named `.env` in the project root folder. Copy the layout from `.env.example`
and input your matching local PostgreSQL access details:
 
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=brightminds_db
JWT_SECRET=YOUR_CRYPTOGRAPHIC_SIGNATURE_KEY_HERE
```
 
3. **Initialize Database Tables:**
 
Create a database named `brightminds_db`, then execute the SQL statements written inside the
`schema.sql` file using pgAdmin 4 or the command-line query tool to build the core data tables.
 
4. **Boot Up the Development Server:**
 
```bash
npm run dev
```
 
## 📡 Core API Endpoint Routing Blueprint Reference Maps
 
### 🔐 User Identity Management Corridors
 
* `POST /api/users/register` - Registers a brand new student, tutor or admin profile.
* `POST /api/users/login` - Validates credentials and returns a signed JWT token.
* `GET /api/users/profile` - Fetches the logged-in user's own profile without the password hash.
* `GET /api/users/admin-only-dashboard` - Test corridor restricted to the `ADMIN` role.
* `GET /api/users/dashboard-sandbox` - Test corridor that echoes the verified token contents.
 
### 🏫 Tutor Directory Corridors
 
* `POST /api/tutors/onboard` - Allows registered tutors to initialize their professional profile.
* `GET /api/tutors` - Public directory search. Optional filters: `?subject=physics&maxPrice=40`.
 
### 📅 Calendar Scheduling Corridors
 
* `POST /api/bookings` - Allows logged-in students to request a live lesson with a tutor.
* `PUT /api/bookings/:id/status` - Allows the assigned tutor to set a booking to `CONFIRMED`,
  `COMPLETED` or `CANCELLED`.
 
### 🧪 Development Diagnostics
 
* `GET /api/cause-crash` - Temporary route that proves the global error handler works.
  Remove it before any public deployment.
