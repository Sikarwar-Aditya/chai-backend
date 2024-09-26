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
app.use(express.cookieParser());




// also a method to export other than export default method
// export default app; 
export { app };