import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv";


// Configuration of cloudinary
cloudinary.config(
    { 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    }
);

const uploadOnCloudinary= async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //  upload the file on cloudinary
         const response= await cloudinary.uploader.upload(localFilePath,
            { resource_type: "auto"}
        )
        // file has been uploaded successfully

        // console.log("file uploaded on Cloudinary !! Hurray 😎", response);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error){
        console.log("error is coming Mr.",error)
        fs.unlinkSync(localFilePath); // remove the locally stored file as the upload action failed
        return null;
    }
}
export {uploadOnCloudinary};
