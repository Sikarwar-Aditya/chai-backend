import {asyncHandler} from "../utils/asyncHandler.js"

// asyncHandler is higher order which accepts a fn 
const registerUser= asyncHandler(async (req,res)=>{
    res.status(200).json({
        message: "ok"
    })
})

export {registerUser};