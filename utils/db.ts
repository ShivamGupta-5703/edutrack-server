require('dotenv').config();
import mongoose from 'mongoose';


const dbURL = process.env.LOCAL_DB_URL || '';
const connectDB = async() => {
    try{
        (await mongoose.connect(dbURL).then((data:any)=>{
            console.log(`Database connected with ${data.connection.host}`);
        }));
    }catch(err : any){
        console.log(err.message);
        setTimeout(connectDB, 5000);
    }
}


export default connectDB;