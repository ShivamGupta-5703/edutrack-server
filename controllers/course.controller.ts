import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary  from 'cloudinary';
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";


//upload course
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const data = req.body;
        const thumbnail = data.thumbnail;
        if(thumbnail){
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder : "courses"
            });
            data.thumbnail = {
                public_id : myCloud.public_id,
                url : myCloud.secure_url
            }
        }
        createCourse(data, res, next);

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
});


// edit course
export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const data = req.body;
        const thumbnail = data.thumbnail;
        if(thumbnail){
            await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder : "courses"
            });
            data.thumbnail = {
                public_id : myCloud.public_id,
                url : myCloud.secure_url
            };
        }

        const courseId = req.params.id;
        const course = await CourseModel.findByIdAndUpdate(
            courseId,
            {
                $set : data
            },
            {
                new : true,
            }
        );

        res.status(201).json({
            success : true,
            message : "Course updated successfully",
            course
        })
        
    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// get single course - without purchasing [not showing complete content]
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const courseId = req.params.id;
        
        // for huge traffic - many people come to see but not buy, so we cache it in redis
        const isCacheExist = await redis.get(courseId);
        if(isCacheExist){
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success : true,
                course,
            });
        }else{
            const course = await CourseModel.findById(req.params.id).select("-courseData.videoURL -courseData.suggestion -courseData.questions -courseData.links");
            
            await redis.set(courseId, JSON.stringify(course), 'EX', 60 * 60 * 24 * 7);  // cache for 7 days

            res.status(200).json({
                success : true,
                course,
            });
        }

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// get all courses - without purchasing
export const getAllCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{        
        // for huge traffic - many people come to see but not buy, so we cache it in redis
        const isCacheExist = await redis.get("allCourses");
        if(isCacheExist){
            const courses = JSON.parse(isCacheExist);
            res.status(200).json({
                success : true,
                courses,
            });
        }else{
            const courses = await CourseModel.find().select("-courseData.videoURL -courseData.suggestion -courseData.questions -courseData.links");
            
            await redis.set("allCourses", JSON.stringify(courses));

            res.status(200).json({
                success : true,
                courses,
            });
        }
        
    }catch(err:any){
        return next(new ErrorHandler(err.message, 500));
    }
})


//get course content - only for valid user
export const getCourseContent = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        
        //console.log(courseId);
        const courseExists = userCourseList?.find((course : any) => course._id.toString() === courseId);
        if(!courseExists){ 
            return next(new ErrorHandler("You are not eligible to access this course", 404));
        }

        const course = await CourseModel.findById(courseId);
        const content = course?.courseData;

        res.status(200).json({
            success : true,
            content,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// add question to course
interface IAddQuestionData{
    question : string;
    courseId : string;
    contentId : string;
}

export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const {question, courseId, contentId} : IAddQuestionData = req.body;
        const course = await CourseModel.findById(courseId);

        if(!mongoose.Types.ObjectId.isValid(contentId)){
            return next(new ErrorHandler("Invalid content id", 400));
        }

        const courseContent = course?.courseData.find((content : any) => content._id.equals(contentId));
        if(!courseContent){
            return next(new ErrorHandler("Invalid content id", 400));
        }

        //create new question object
        const newQuestion : any = {
            user : req.user,
            question,   
            questionReplies : []
        }

        // send notification to admin
        await NotificationModel.create({
            user : req.user?._id,
            title : "New Question Received",
            message : `${req.user?.name} has created a new question in ${courseContent.title}`
        })

        courseContent.questions.push(newQuestion);
        await course?.save();

        res.status(201).json({
            success : true,
            message : "Question added successfully",
            course,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// add answer to question
interface IAddAnswerData{
    answer : string;
    courseId : string;
    contentId : string;
    questionId : string;
}

export const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const {answer, courseId, contentId, questionId} : IAddAnswerData = req.body;

        const course = await CourseModel.findById(courseId);

        if(!mongoose.Types.ObjectId.isValid(contentId)){
            return next(new ErrorHandler("Invalid content id", 400));
        }

        const courseContent = course?.courseData?.find((content : any) => content._id.equals(contentId));
        if(!courseContent){
            return next(new ErrorHandler("Invalid content id", 400));
        }

        const question = courseContent?.questions?.find((question : any) => question._id.equals(questionId));
        if(!question){
            return next(new ErrorHandler("Invalid question id", 400));
        }

        // create answer object
        const newAnswer : any = {
            user : req.user,
            answer,
        }
        question.questionReplies.push(newAnswer);
        await course?.save();
 
        // send user email that your question is answered
        if(req.user?._id === question.user?._id){
            //create notification for admin to reply
            await NotificationModel.create({
                user : req.user?._id,
                title : "New Question Reply Received",
                message : `You have a new reply to your question in ${courseContent.title}`
            });

        }else{
            // if replied, send a notification to user that his question is answered
            const data = {
                name : question.user.name,
                title : courseContent.title,
            };

            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);

            try{
                await sendMail({
                    email : question.user.email,
                    subject : "Question reply",
                    template : "question-reply.ejs",
                    data,
                });
            }catch(err : any){
                return next(new ErrorHandler(err.message,500));
            }
        }

        res.status(201).json({
            success : true,
            message : "Answer added successfully",
            course,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
});


// add review in course
interface IAddReviewData{
    review : string;
    rating : number;
    userId : string;   
}

export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const userCourseList = req.user?.courses;
        
        const courseId = req.params.id;

        // check if user is eligible for course
        const courseExists = userCourseList?.some((course : any) => course._id.toString() === courseId.toString());
        if(!courseExists){
            return next(new ErrorHandler("You are not eligible to access this course", 404));
        }

        const course = await CourseModel.findById(courseId);
        const {review, rating} = req.body as IAddReviewData;
        const reviewData : any = {
            user : req.user,
            rating,
            comment : review,
        }
        course?.reviews.push(reviewData);

        //calculate rating
        let avg = 0;
        course?.reviews.forEach((review : any) => {
            avg += review.rating;
        })
        if(course){
            course.rating = avg / course.reviews.length;
        }
        await course?.save();

        const notification = {
            title : "New Review Created",
            message : `${req.user?.name} has given a review in ${course?.name}`
        }
        //create notification for admin

        res.status(201).json({
            success : true,
            message : "Review added successfully",
            course,
        })
        
    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// add reply to review
interface IAddReviewReplyData{
    comment : string;
    reviewId : string;
    courseId : string;
}

export const addReviewToReply = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const {comment, reviewId, courseId} = req.body as IAddReviewReplyData;
        const course = await CourseModel.findById(courseId);
        if(!course){
            return next (new ErrorHandler("Course not found", 404));
        }

        const review = course?.reviews?.find((review : any) => review._id.toString() === reviewId.toString());
        if(!review){
            return next (new ErrorHandler("Review not found", 404));
        }

        const replyData : any = {
            user : req.user,
            comment,    
        }
        if(!review.commentReplies){
            review.commentReplies = [];
        }

        review.commentReplies?.push(replyData);
        await course?.save();
        res.status(200).json({
            success : true,
            course,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// get all courses -- only for admin
export const getAllCourse = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        getAllCoursesService(res);
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// delete course  -- only for admin
export const deleteCourse = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const {id} = req.params;
        const course = await CourseModel.findById(id);
        if(!course) return next(new ErrorHandler("Course not found", 400));

        await course.deleteOne({id});
        await redis.del(id);

        res.status(200).json({
            success : true,
            message : "Course deleted successfully",
        })
        
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})

