import mongoose , {Document, Model, Schema} from 'mongoose';
import { IUser } from './user.model';


interface IComment extends Document{
    user : IUser;
    question : string;
    questionReplies : IComment[];
}


interface IReview extends Document{
    user : IUser;
    comment : string;
    rating : number;
    commentReplies? : IComment[];
}


interface ILink extends Document{
    title : string;
    url : string;
}


interface ICourseData extends Document{
    title : string;
    description : string;
    videoURL : string;
    videoThumbnail : string;
    videoSection : string;
    videoLength : string;
    videoPlayer : string;
    links : ILink[];
    suggestion : string;
    questions : IComment[];
}


interface ICourse extends Document{
    name : string;
    description : string;
    price : number;
    estimatedPrice? : number;
    thumbnail : object;
    tags : string;
    level : string;
    demoURL : string;
    benefits : {title : string}[];
    reviews : IReview[];
    prerequisites : {title : string}[];
    courseData : ICourseData[];
    createdAt : Date;
    rating? : number;
    purchased? : number;
    topic: string;
    salesType: 'online' | 'classroom';
}


const reviewSchema = new Schema<IReview>({
    user : Object,
    comment : String,
    rating : {
        type : Number, 
        default : 0,
    },
    commentReplies : [Object], // array of comments
});


const linkSchema = new Schema<ILink>({
    title : String,
    url : String,
})


const commentSchema = new Schema<IComment>({
    user : Object,
    question : String,
    questionReplies : [Object],
})


const courseDataSchema = new Schema<ICourseData>({
    title : String,
    description : String,
    videoURL : String,
    videoSection : String,
    videoLength : String,  
    videoPlayer : String,
    links : [linkSchema],
    suggestion : String,
    questions : [commentSchema],
});


const courseSchema = new Schema<ICourse>({
    name : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        required : true,
    },
    price : {
        type : Number,
        required : true,
    },
    estimatedPrice :{
        type : Number,
    },
    thumbnail : {
        public_id : {
            type : String,
        },
        url : {
            type : String,
        },
    },
    level : {
        type : String,
        required : true,
    },
    demoURL : {
        type : String,
        required : true,
    },
    tags : {
        type : String,
        required : true,
    },
    benefits : [ { title : String}],
    prerequisites : [ { title : String}],
    reviews : [reviewSchema],
    courseData : [courseDataSchema],
    rating : {
        type : Number,
        default : 0,
    },
    purchased : {
        type : Number,
        default : 0,
    },
    topic: {
        type: String,
        required: true,
    },
    salesType: {
        type: String,
        enum: ['online', 'classroom'],
        required: true,
    },
}, {timestamps : true});


const CourseModel : Model<ICourse> = mongoose.model('Course', courseSchema);
export default CourseModel;

