import { authorizeRoles, isAuthenticated } from './../middleware/auth';
import express from 'express';
import { activationUser, deleteUser, getAllUsers, getEnrollmentDetails, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole } from '../controllers/user.controller';
const userRouter = express.Router();

userRouter.post('/registration', registrationUser);
userRouter.post('/activate-user', activationUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);

userRouter.get('/refresh', updateAccessToken);

userRouter.get('/me', isAuthenticated, getUserInfo);
userRouter.post('/social-auth', socialAuth);
userRouter.put('/update-user-info', updateUserInfo);
userRouter.put('/update-user-password', isAuthenticated, updatePassword);
userRouter.put('/update-user-avatar', isAuthenticated, updateProfilePicture);

userRouter.get('/get-users', isAuthenticated, authorizeRoles("admin"), getAllUsers);
userRouter.put('/update-user', isAuthenticated, authorizeRoles("admin"), updateUserRole);

userRouter.delete('/delete-user/:id', isAuthenticated, authorizeRoles("admin"), deleteUser);

userRouter.get('/enrollment/:courseId', isAuthenticated, getEnrollmentDetails);

export default userRouter;