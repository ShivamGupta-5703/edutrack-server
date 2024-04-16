import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";


export const ErrorMiddleware = (err : any, req : Request, res : Response, next : NextFunction) => {
    err.statusCOde = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    
    // console.log(err);
    if(err.name === `CastError`){
        const message = `Resource not found, Invalid : ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    if(err.name === `JsonWebTokenError`){
        const message = `JSON web token is expired, try again`;
        err = new ErrorHandler(message, 400);
    }

    if(err.name === `TokenExpiredError`){
        const message = `Token Expired, try again`;
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCOde).json({
        success: false,
        message : err.message,
    })
}