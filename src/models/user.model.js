import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema= new mongoose.Schema(
    {
        username :{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // used for searching 
        },
        email :{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName :{
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar :{
            type: String,// (cloudinary url) we will upload to cloudinary which will give url (string)
            required: true,
        },
        coverImage:{
            type: String // cloudinary url
        },
        // watchHistory will be arrays of watched videos
        watchHistory :[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type:String,
            required: [true, "Password is required"]
        },
        refreshToken:{
            type: String,
        }   
    },
    {timestamps : true}
);
// dont use arrow function here becuase that doesnt give reference we need reference to interact with user variables

userSchema.pre("save", async function (next){
    // wrong Notation-- if(!this.password.ismodified("password")) return next();
    if(!this.isModified("password")) return next();
    // to ensure first password must be hashed before moving to save  
    this.password=  await bcrypt.hash(this.password,10)
    next()
});



// custom method to compare our entered password with original password saved in database in hashed form 
userSchema.methods.isPasswordCorrect= async function (password){
    return await bcrypt.compare(password,this.password);
}

// custom methods to generate refresh and access tokens with the help of jwt 
// *** generally no need to use async and await this doesn't take much time

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    

}

export const User= mongoose.model("User",userSchema);
