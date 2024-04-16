require('dotenv').config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ErrorMiddleware } from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from './routes/order.route';
import notificationRouter from './routes/notification.route';
import analyticsRouter from './routes/analytics.route';
import layoutRouter from './routes/layout.route';

export const app = express();

//body parser with limit 50mb
app.use(express.json({limit : "50mb"}));
app.use(cookieParser());
app.use(cors({
    origin : process.env.ORIGIN
}));

app.use("/api/v1", userRouter);
app.use("/api/v1", courseRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", analyticsRouter);
app.use("/api/v1", layoutRouter);

app.get("/test",(req,res,next)=>{
    res.status(200).json({
        success : true,
        message : "Hello World"
    })
})

//send error for unknown routes
app.all("*", (req,res,next)=>{
    const err = new Error(`Can't find ${req.originalUrl} on this server`) as any;
    err.statusCode = 404,
    next(err);
})

app.use(ErrorMiddleware);