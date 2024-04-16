require('dotenv').config()
import {redis} from './redis';
import { IUser } from '../models/user.model';
import { Response } from 'express';


interface ITokenOptions{
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none" | undefined;
    secure?: boolean;
}

//get tokens from .env
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRY || "300", 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRY || "1200", 10);

//make cookies
export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 1000 * 60),
    maxAge: accessTokenExpire * 1000 * 60,
    httpOnly: true,
    sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 1000 * 60 * 60 * 24),
    maxAge: refreshTokenExpire * 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
};

export const sendToken = (user : IUser, statusCode : number, res: Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    //add session of logged in user in redis
    redis.set(user._id, JSON.stringify(user) as any);

    //secure in production
    if(!process.env.NODE_ENV || process.env.NODE_ENV === "production"){
        accessTokenOptions.secure = true;
        refreshTokenOptions.secure = true;
    }

    //send cookies
    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);

    //send response
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    })
}