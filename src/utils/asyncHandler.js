// ---- Higher Order Functions are used here as wrapper fn 💖💖😎😎 !-----
// METHOD 1  promises 

const asyncHandler= (requestHandler)=>{
    (req, res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=> next(err));
    }
}

export {asyncHandler}



// METHOD-  2 try & catch 
// const asyncHandler = (fn)=> async(req, res, next)=>{
//     try{
//         await fn(req, res,next);
//     }
//     catch(error){
//         res.status( error.code || 500).json({
//             success: false,
//             message: error.message,
//         })
//     }

// }
