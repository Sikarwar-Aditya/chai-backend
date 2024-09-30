import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app= express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials : true,
}))

// Parse incoming JSON requests with a 16KB limit
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded data from form submissions with a 16KB limit
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from the "public" directory and anyone can access these files
app.use(express.static("public"));

// Parse cookies from incoming requests
app.use(cookieParser());



// routes import
import userRouter from "./routes/user.routes.js"

// routes declaration------------->
// we will use() method instead of get() method becuase here controllers ans routes are in different-2 folders so we need a middleware..

app.use("/api/v1/users",userRouter) ;

// url--> http://localhost:8000/api/v1/users/register


// also a method to export other than export default method
// export default app; 
export { app };