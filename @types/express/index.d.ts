import * as express from "express"
import { IUser } from '../models/user.model';

declare global{
    namespace Express{
        interface Request{
            user?: Record<string,any>
        }
    }
}