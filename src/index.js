
// already mongoose is imported in inner index.js
// import mongoose from "mongoose";
// import {DB_NAME} from "./constants.js"

// require('dotenv').config({path : './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})








// method 2
connectDB();













/*   1st method to connnect database directly in index.js  makes it congested ----->
// special type of fn declaration " ifis" to define and call function simultaenously
import express from "express"
const app= express()
( async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       // for let database is connected but express cant talk
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })
        // if all fine
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${procees.env.PORT}`);
        })

    } catch(error){
        console.error("Error: ",error);
        throw err
    }
    

}) ()
*/