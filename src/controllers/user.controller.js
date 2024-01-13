import { asyncHandler } from "../utils/asyncHandler.js";

// register user method 
const registerUser = asyncHandler( async (req, res)=>{
    res.status(200).json({
        message: "backend testing successful happy now"
    })
} )

export {registerUser}