import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefereshToken= async (userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // generated token is added to user 
        user.refreshToken= refreshToken;

        // saving this to database also
        await user.save({ validateBeforeSave : false });

        return {accessToken, refreshToken};

    }
    catch(error){
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "something went wrong while generating access and refresh tokens");
    }
}


// asyncHandler is higher order which accepts a fn 
const registerUser= asyncHandler(async (req,res)=>{
    // 1 get user details from frontend
    // 2 validation - not empty
    // 3 check if user already exists: username, email
    // 4 check for images, check for avatar
    // 5 upload them to cloudinary, avatar
    // 6 create user object - create entry in db
    // 7 remove password and refresh token field from response
    // 8 check for user creation
    // 9 return res

// 1--> taking details from user
    const {fullName, email,username,password}= req.body;
    // console.log("req.body : ",req.body);


// 2--> validation checking

    // ----------SIMPLE VALIDATION METHOD------------
    // if(username===""){
        //     throw new ApiError(400,"usernmame is required");
        // }
        // ----------ADVANCED VALIDATION METHOD------------
        
        if(
            [fullName,email,username,password].some( (field) =>
                field?.trim()==="" )
        ){
            throw new ApiError(400,"all fields are required");
        }
// 3--> checking user exits or not
        // here user model is made on mongoose so it can directly check our queries in database
    const existedUser= await User.findOne({
        $or : [{ username },{ email }]
    })
    if(existedUser){
        throw new ApiError(409, "email  or  username is already registered");
    }
    // console.log("exitedUser: ",existedUser);  
    // console.log("req.files: ",req.files);  

    const avatarLocalPath= req.files?.avatar[0]?.path;
    // if coverImage not sent it will give error so check simply
    // const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) 
        && req.files.coverImage.length > 0 ){
         coverImageLocalPath= req.files.coverImage[0].path;
    }

    
// 4---->
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required");
    }
    // 5---->
    const avatar= await uploadOnCloudinary(avatarLocalPath);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);
    
    if(!avatar){
        throw new ApiError(400, "--avatar is required");
    }
// 6--->
    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )
// 7--->

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
// 8---->

    if(!createdUser){
        throw new ApiError(500," Something went wrong while registering the user");
    }

// 9--->
    
    return res.status(201).json(
        new ApiResponse(200, createdUser ,"User registered successfully ")
    )

}) 

const loginUser= asyncHandler(async (req, res)=>{
    // 1. take data from req body
    // 2. login basis on email/username
    // 3. find the user
    // 4. password check
    // 5. access and refresh tokens are generated
    // 6. send cookie---> to send these tokens

    //1.  take data
    const{username, email, password}= req.body;
    //2. login basis
    if(!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }
    //3. find the user
    const user = await User.findOne({
        $or : [{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "user not exists");
    }
    // 4. it means user is found now check password
    const isPasswordValid= user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials");
    }
    // 5. access and refresh tokens

    const {accessToken, refreshToken}= await generateAccessAndRefereshToken(user._id);

    // here we have user but in that our access token are not as we set it in generateAccessAndRefereshToken

    const loggedInUser= await User.findById(user._id).select("-password -refreshToken");


    //6. send cookie
    // for cookies we use options so that only server can modifies our cookies only, while user can see only
    const options= {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )





})

const logoutUser= asyncHandler( async(req,res)=>{
    //1. refreshToken is removed from dataBase
    // here we need to remove refreshtoken but it is availble at user so with help of auth middlware we added user in req to access it here
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : 
            {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    //2. remove cookies
    const options= {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})

const refreshAccessToken= asyncHandler(async (req, res)=>{
    // req.body is used to get token when user is using mobile
    const incomingRefreshToken= req.cookes.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }
    
    try {
        const decodedToken= jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET);
            
            if(!decodedToken){  
                throw new ApiError(401, "Invalid token");
            }
            
            const user= await User.findById(decodedToken?._id);
            // matching incoming token with user token
            if(!decodedToken){  
                throw new ApiError(401, "Invalid refresh token");
            }
    
            if(incomingRefreshToken !== user.refreshToken){
                throw new ApiError(401,"Refresh token expires or used");
            }
    
            const options ={
                httpOnly:true,
                secure: true
            }
    
            const {accessToken, newRefreshToken}=
            generateAccessAndRefereshToken(user._id);
    
            res.
            status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
    
                )
            )
    } catch (error) {
        throw new ApiError( 401, error?.message || "invalid refres token");
        
    }      
    

})

const changeCurrentPassword= asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword}= req.body
    // as our req has user field we will add via middleware so we can get current password
    const user= await User.findById(req.user?._id);

    const isPasswordCorrect= user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Your old password is inCorrect");
    }

    user.password= newPassword;
    // password is saved.. here in dataBase also
    user.save({validateBeforeSave : false});

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed successfullly."));
    
})

const getCurrentUser= asyncHandler(async(req, res)=>{
    const user= User.findById(req.user?._id);
    // or we can direct return req.user in json also...

    return res.status(200)
    .json(new ApiResponse(200, user, "user fetched successfullly"));
})

const updateAccountDetails= asyncHandler(async (req, res)=>{
    const {fullName,email}= req.body;
    
    if(!fullName || !email){
        throw new ApiError(400, "all fields are mandatory");
    }

    const user = await User.findByIdAndUpdate(user.req?._id,
        {
            $set : {
                fullName,     // both syntax are valid...
                email: email
            }
        },
        {new : true} // it gives new information
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Account details are updated successfully"));
            
})

const updateUserAvatar= asyncHandler(async (req, res)=>{
    // file --> need to deal with one file only && files--> needs to deal more files
    const avatarLocalPath= req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(401, "Avatar file is missing");
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    // return avatar is object 

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar file on cloudinary")
    }

    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new :true}
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200,user,"Avatar updated successfully"))

})
const updateUserCoverImage= asyncHandler(async (req, res)=>{
    // file --> need to deal with one file only && files--> needs to deal more files
    const CoverImageLocalPath= req.file?.path;
    if(!CoverImageLocalPath){
        throw new ApiError(401, "CoverImage file is missing");
    }

    const coverImage= await uploadOnCloudinary(CoverImageLocalPath);
    // returned avatar is object 

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage file on cloudinary")
    }

    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage: coverImage.url
            }
        },
        {new :true}
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200,user,"CoverImage updated successfully"))

})

const getUserChannelProfile= asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username is missing");
    }
    // it return an array
    const channel= await User.aggregate(
        [
            {
                $match:{
                    usermane : username?.toLowerCase()
                }
            },
            {
                // Total subscribers 
                $lookup :{
                    // as we know in dataBase all becomes lowercase and plural
                    // Subscription ---> subscriptions
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {   // subscribed to 
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size: "$subscribers"

                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            $if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                            then : true, else : false
                        }
                    }

                }
            },
            {
                $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(404,"channel not exists")
    }

    return res
    .status(200)
    .json(200, channel[0], "user channel fetched successfully.")


})

const getWatchHistory= asyncHandler(async(req, res)=>{
    // here user will be an array
    const user= User.aggregate(
        [
            {
                $match: {
                    // in mongoDb id is stored as ObjectId(<string>) but our id we get generally string because mongoose do all required operations in btw but here we mongoose will not do self

                    _id: new mongoose.Types.ObjectId(user.req?._id)
                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField:"WatchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    // used nested pipeline because owner of video is an user so we need to do lookup again --- called nested pipeline
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                // here we used other nested pipeline to get only required data of owner of video
                                pipeline:[
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        },
                        // we added this extra to conver array named "owner" to object named "owner" to access direct its values just by "."
                        {
                          $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                          }  
                        }
                    ]


                }
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].getWatchHistory),"watch history fetched successfully"
    )
})

    export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory

    };