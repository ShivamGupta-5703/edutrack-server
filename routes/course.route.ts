import { authorizeRoles, isAuthenticated } from './../middleware/auth';
import express from 'express';
import {  addAnswer, addQuestion, addReview, addReviewToReply, deleteCourse, editCourse, getAllCourse, getAllCourses, getCourseContent, getSingleCourse, uploadCourse} from '../controllers/course.controller';
const courseRouter = express.Router();

courseRouter.post('/create-course', isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-courses', getAllCourses);
courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseContent);
courseRouter.put('/add-question', isAuthenticated, addQuestion);
courseRouter.put('/add-answer', isAuthenticated, addAnswer);
courseRouter.put('/add-review/:id', isAuthenticated, addReview);
courseRouter.put('/add-reply', isAuthenticated, authorizeRoles("admin"), addReviewToReply);
courseRouter.get('/get-courses', isAuthenticated, authorizeRoles("admin"), getAllCourse);  
courseRouter.delete('/delete-courses/:id', isAuthenticated, authorizeRoles("admin"), deleteCourse);  


export default courseRouter; 
