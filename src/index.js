import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"

import express from "express"
const app= express()

// special type of fn declaration " ifis" to define and call function simultaenously
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