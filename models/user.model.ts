require('dotenv').config();
import bcrypt from 'bcryptjs';
import mongoose, {Document, Model, Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
const emailRegexPattern : RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar:{
        public_id: string;
        url: string;
    },
    role: string;
    isVerified: boolean;
    courses: Array<{courseId : string}>;
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
}

const userSchema : Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        validate: {
            validator: (value: string) => emailRegexPattern.test(value),
            message: 'Please provide a valid email'
        },
        unique: true
    },
    password: {
        type: String,
        minlength: [6,'Password must be at least 6 characters long'],
        select: false,
    },
    avatar:{
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: String,
        }
    ]
},{timestamps: true});


//Encrypt password using bcrypt
userSchema.pre<IUser>('save', async function(next){
    if(!this.isModified('password')) next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//compare password
userSchema.methods.comparePassword = async function(password: string) : Promise<boolean>{
    return await bcrypt.compare(password, this.password);
};

//sign access token
userSchema.methods.SignAccessToken = function(){
    return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN || '',{expiresIn : "5m"});
};

// sign refresh token
userSchema.methods.SignRefreshToken = function(){
    return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN || '',{expiresIn : "1d"});  
};


const UserModel: Model<IUser> = mongoose.model('User', userSchema);
export default UserModel; 