require('dotenv').config();
import { Request, Response, NextFunction } from "express";
import UserModel, {IUser} from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ejs from 'ejs';
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";
import cloudinary from "cloudinary";


// register user
interface IRegistrationBody{
    name : string,
    email : string,
    password : string
    avatar? : string,
}

export const registrationUser = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const {name, email, password} : IRegistrationBody = req.body;

        const isEmailExist = await UserModel.findOne({email});
        if(isEmailExist){
            return next(new ErrorHandler("Email already exist", 400));
        }
        
        const user : IRegistrationBody = {
            name, email, password,
        }
        
        const activationToken = createActivationToken(user);  // 4 digit number for otp

        const activationCode = activationToken.activationCode;

        const data = {user : {name : user.name}, activationCode};

        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

        try{
            await sendMail({
                email : user.email,
                subject : "Activate your account",
                template: "activation-mail.ejs",
                data,
            });

            res.status(200).json({
                success : true,
                message : `Registration Success, Please check your email : ${user.email} to activate your account !!`,
                activtionToken: activationToken.token,
            });
        }catch(err : any){
            return next(new ErrorHandler(err.message, 400));
        }
        
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
});


//generate activation token
interface IActivationToken{
    token : string;
    activationCode : string;
}

export const createActivationToken = (user: any) : IActivationToken => {

    // generate a 4 digit token to send otp to user mail
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_TOKEN_SECRET as Secret, {
        expiresIn: "5m"
    });

    return {token, activationCode};
}


// validate user
interface IActivationRequest{
    activation_token : string;
    activation_code : string;
}

export const activationUser = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
     try{
        const {activation_token, activation_code} = req.body as IActivationRequest;

        const newUser : {user : IUser, activationCode : string} = jwt.verify(
            activation_token, 
            process.env.ACTIVATION_TOKEN_SECRET as Secret
        ) as {user : IUser, activationCode : string};

        if(newUser.activationCode !== activation_code){
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        const {name, email, password} = newUser.user;

        const existUser = await UserModel.findOne({email});

        if(existUser) return next(new ErrorHandler("Email already exist", 400));

        const user = await UserModel.create({
            name, email, password,
        })

        res.status(200).json({
            success : true,
        })
        
     }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
     }
})


//login user
interface ILoginRequest{
    email : string;
    password : string;
}

export const loginUser = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        
        const {email, password} = req.body as ILoginRequest;
        if(!email || !password) return next(new ErrorHandler("Please enter email & password", 400));
        
        const user = await UserModel.findOne({email}).select("+password");
        if(!user) return next(new ErrorHandler("Invalid email or password", 400));

        const isMatch = await user.comparePassword(password);
        if(!isMatch) return next(new ErrorHandler("Invalid email or password", 400));

        sendToken(user, 200, res);
        
    }catch(err:any){
        console.log("wdeecwfdsvdcxzc");
        
        return next(new ErrorHandler(err.message, 400));
    }
})


//logout user
export const logoutUser = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        res.cookie("access_token", "", {maxAge : 1});
        res.cookie("refresh_token", "", {maxAge : 1});
        
        const userId = req.user?._id || '';
        console.log(req.user);
        
        redis.del(userId);

        res.status(200).json({
            success : true,
            message : "Logged out successfully"
        })
    }catch(err : any){

        console.log("fygukyhijkjlkhbh");
        
        return next (new ErrorHandler(err.message, 400));
    }
})


//update access token
export const updateAccessToken = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const refresh_token = req.cookies.refresh_token;
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
        const message = "Could not refresh token";
        if(!decoded) return next(new ErrorHandler(message, 400));

        const session = await redis.get(decoded.id as  string);
        if(!session) return next(new ErrorHandler("Please login to access this resource !", 400));

        const user = JSON.parse(session);

        const accessToken  = jwt.sign({id : user._id}, process.env.ACCESS_TOKEN as string, { expiresIn : "5m"});
        const refreshToken  = jwt.sign({id : user._id}, process.env.REFRESH_TOKEN as string, { expiresIn : "1d"});

        req.user = user;

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, accessTokenOptions);

        await redis.set(user._id, JSON.stringify(user), "EX", 60 * 60 * 24 * 7);   // Store user in cache for 7 days only.

        res.status(200).json({
            status : "Success",
            accessToken,
        })

    }catch(err : any){
        console.log("aedcswfvergbthynjum");
        
        return next(new ErrorHandler(err.message, 400));
    }
})


//get user info
export const getUserInfo = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const userId = req.user?.id;
        getUserById(userId, res);
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// social auth [data will come from frontend]
interface ISocialAuthBody{
    email :  string;
    name : string;
    avatar : string;
}

export const socialAuth = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        
        const {name, email, avatar} = req.body as ISocialAuthBody;
        const user = await UserModel.findOne({email});
        if(!user){
            const newUser = await UserModel.create({name, email, avatar});
            sendToken(newUser, 200, res);
        }else{
            sendToken(user, 200, res);
        }

    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// update user info
interface IUpdateUserInfo{
    name : string;
    email : string;
}

export const updateUserInfo = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const {name, email} = req.body as IUpdateUserInfo;
        const userId = req.user?.id;
        const user = await UserModel.findById(userId);

        if(email && user){
            const isEmailExist = await UserModel.findOne({email});
            if(isEmailExist) return next(new ErrorHandler("Email already exist", 400));
            user.email = email;
        }
        if(name && user) user.name = name;

        await user?.save();

        await redis.set(userId, JSON.stringify(user));

        res.status(201).json({
            success : true,
            user,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// update password
interface IUpdatePassword{
    oldPassword : string;
    newPassword : string;
}

export const updatePassword = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const {oldPassword, newPassword} = req.body as IUpdatePassword;
        if(!oldPassword || !newPassword) return next(new ErrorHandler("Please enter old & new password", 400));

        const user = await UserModel.findById(req.user?._id).select("+password");
        if(user?.password === undefined) return next(new ErrorHandler("Password not found", 400));

        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if(!isPasswordMatch) return next(new ErrorHandler("Old password is incorrect", 400));

        user.password = newPassword;
        await user?.save();
        await redis.set(req.user?._id, JSON.stringify(user));

        res.status(200).json({
            success : true,
            user,
        })
    
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// update profile picture
interface IUpdateProfilePicture{
    avatar : string;
}

export const updateProfilePicture = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const userId = req.user?._id;
        const {avatar} = req.body as IUpdateProfilePicture;

        const user = await UserModel.findById(userId);

        if(avatar && user){

            // if already has an avatar
            if(user?.avatar?.public_id){
                //delete old
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
                
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder : "avatars",
                    width : 150,
                })
                user.avatar = {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url,
                };
            }else{
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder : "avatars",
                    width : 150,
                })
                user.avatar = {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url,
                };
            }
        }

        await user?.save();
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({
            success : true,
            user,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// get all users  -- only for admin
export const getAllUsers = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        getAllUsersService(res);
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// update user role  -- only for admin
export const updateUserRole = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const {id, role} = req.body;
        updateUserRoleService(id, role, res);

    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})


// delete user  -- only for admin
export const deleteUser = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        const {id} = req.params;
        const user = await UserModel.findById(id);
        if(!user) return next(new ErrorHandler("User not found", 400));

        await user.deleteOne({id});
        await redis.del(id);

        res.status(200).json({
            success : true,
            message : "User deleted successfully",
        })
        
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})










