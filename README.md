# EduTrack - Learning Management System

### *EduTrack is a data visualization project aimed at tracking the sales performance of an organization offering classroom and online courses across different continents and topics. This README provides an overview of the backend implementation of the project.*


# Features
## User Management -->
1. **User Registration:** Allows users to register an account.
2. **User Activation:** Activates user accounts after registration.
3. **User Login/Logout:** Provides authentication with login and logout functionality.
4. **Token Refresh:** Refreshes access tokens for authenticated users.
5. **User Profile Management:** Allows users to view and update their profile information and avatar.
6. **Social Authentication:** Supports authentication via social media platforms.
7. **User Role Management:** Admins can update user roles and access user details.
8. **User Deletion:** Admins can delete user accounts.

## Course Management -->
1. **Course Creation/Editing:** Admins can create and edit course details.
2. **Course Deletion:** Admins can delete courses.
3. **Course Content Retrieval:** Allows users to retrieve course content.
4. **Question and Answer Management:** Users can add questions and answers to course content.
5. **Review Management:** Users can add reviews to courses, and admins can add replies to reviews.

## Order Management -->
1. **Order Creation:** Allows users to create orders for courses.
2. **Order Retrieval:** Admins can retrieve all orders.

## Notification Management -->
1. **Notification Retrieval/Update:** Admins can retrieve and update notifications.

## Layout Management -->
1. **Layout Creation/Editing:** Admins can create and edit layouts.

## Analytics -->
1. **User Analytics:** Provides analytics data on user activity.
2. **Order Analytics:** Provides analytics data on orders.
3. **Course Analytics:** Provides analytics data on courses.
4. **Continent-wise Analytics:** Provides analytics data on user continents.
5. **Topic-wise Sales Analysis:** Analyzes sales data based on course topics.
6. **Classroom vs. Online Sales Comparison:** Compares sales between classroom and online courses.

## Technologies Used -> 
1. **Node.js**
2. **Express.js**
3. **TypeScript**
4. **MongoDB with Mongoose** for database management
5. **JWT** for authentication
6. **Bcrypt.js** for password hashing
7. **Cloudinary** for thumbnail and video content storage and management
8. **Cookie-parser** for parsing cookies
9. **CORS** for Cross-Origin Resource Sharing
10. **Dotenv** for environment variable management
11. **EJS** for making templates of mails 
12. **Redis** for caching with ioredis
13. **Node-cron** for scheduling tasks
14. **Nodemailer** for sending emails

## Setup Instructions -->
1. **Clone the repository:**

```
git clone https://github.com/ShivamGupta-5703/lms-server.git
```
2. **Install dependencies:**
```
npm install
```
3. **Set up environment variables:**
#### Create a .env file in the root directory and configure following necessary environment variables -> 

    1. PORT=8000
    2. ORIGIN=['http://localhost:3000/']
    3. DB_URL=
    4. REDIS_URL=
    5. NODE_ENV=development

#### From cloudinary
    6. CLOUD_NAME=
    7. CLOUD_API_KEY=
    8. CLOUD_SECRET_KEY=

    9. ACTIVATION_TOKEN_SECRET=

#### From your google account
    10. SMTP_HOST=smtp.gamil.com
    11. SMTP_PORT=465
    12. SMTP_SERVICE=gmail
    13. SMTP_MAIL=shivgupta39693@gmail.com
    14. SMTP_PASSWORD=jvbzwrixafwxuocz

#### random tokens for access and refresh tokens
    15. ACCESS_TOKEN=''
    16. REFRESH_TOKEN=''

#### Access token expiry in minutes & Refresh token expiry in days
    17. ACCESS_TOKEN_EXPIRY=
    18. REFRESH_TOKEN_EXPIRY=

4. **Start the server:**
```
npm start
```
