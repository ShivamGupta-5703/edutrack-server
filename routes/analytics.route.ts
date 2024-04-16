import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getCoursesAnalytics, getOrderAnalytics, getSalesComparison, getTopicSalesAnalysis, getUserContinentData, getUsersAnalytics } from "../controllers/analytics.controller";
const analyticsRouter = express.Router();


analyticsRouter.get("/get-users-analytics", isAuthenticated, authorizeRoles("admin"), getUsersAnalytics);

analyticsRouter.get("/get-orders-analytics", isAuthenticated, authorizeRoles("admin"), getOrderAnalytics);

analyticsRouter.get("/get-courses-analytics", isAuthenticated, authorizeRoles("admin"), getCoursesAnalytics);

analyticsRouter.get('/continent-data', isAuthenticated, authorizeRoles("admin"), getUserContinentData);

analyticsRouter.get('/topic-sales-analysis', isAuthenticated, authorizeRoles("admin"), getTopicSalesAnalysis);

analyticsRouter.get('/sales-comparison', isAuthenticated, authorizeRoles("admin"), getSalesComparison);


export default analyticsRouter;