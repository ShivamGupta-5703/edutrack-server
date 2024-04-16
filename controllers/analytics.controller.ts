import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import UserModel, { IUser } from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";


// Users analytics - Admin
export const getUsersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(UserModel);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// Courses analytics - Admin
export const getCoursesAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courses = await generateLast12MonthsData(CourseModel);
  
        res.status(200).json({
          success: true,
          courses,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
);
  
  
// Order analytics - Admin
export const getOrderAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orders = await generateLast12MonthsData(OrderModel);
  
        res.status(200).json({
          success: true,
          orders,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
);
  

// Get data continent wise analytics - Admin
export const getUserContinentData = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
      const users: IUser[] = await UserModel.find({});
      
      const continentData = users.reduce((acc: { [continent: string]: number }, user: IUser) => {
          if (user.continent) {
              acc[user.continent] = acc[user.continent] ? acc[user.continent] + 1 : 1;
          }
          return acc;
      }, {});

      // for D3.js
      const pieChartData = Object.keys(continentData).map((continent) => ({
          continent,
          count: continentData[continent]
      }));

      // send data for D3.js
      res.status(200).json({
          success: true,
          data: pieChartData
      });
  } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
  }
});


// Get topic-wise sales analysis - Admin
export const getTopicSalesAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const topicSales = await CourseModel.aggregate([
          { $match: { salesType: 'online' } }, // Filter online courses
          {
              $group: {
                  _id: '$topic', // Group by topic
                  totalSales: { $sum: 1 }, // Count the number of courses in each topic
              },
          },
      ]);
      res.status(200).json({ success: true, data: topicSales });
  } catch (err : any) {
      return next(new ErrorHandler(err.message, 400));
  }
};


// Get sales comparison between classroom and online courses - Admin
export const getSalesComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const salesComparison = await CourseModel.aggregate([
          {
              $group: {
                  _id: '$salesType', // Group by sales type
                  totalSales: { $sum: 1 }, // Count the number of courses in each sales type
              },
          },
      ]);
      res.status(200).json({ success: true, data: salesComparison });
  } catch (err : any) {
      return next(new ErrorHandler(err.message, 400));  
    }
};





