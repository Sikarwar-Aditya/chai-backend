import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js"


const verifyJWT= asyncHandler(async(req,res,next) =>{
    try {
        // we are finding access token sometimes header contains it
        const token = req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "Invalid Access");
        }
        req.user= user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
        
    }
})

export {  verifyJWT };