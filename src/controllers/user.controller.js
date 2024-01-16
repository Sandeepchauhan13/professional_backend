import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
// register user method 
// asynchandler higher order function jo accept krta hia function ko 

const registerUser = asyncHandler( async (req, res)=>{
    // res.status(200).json({
        // message: "backend testing successful happy now"
        // })

        // get user details from frontend
        // validation not empty
        // check if user already exists : note username se b email se b ek se b kar sakte hen
    //    check for images , check for avatar 
    // upload them to cloudinary, avatar
    // create user object - create entry in db 
    // remove password and refresh token field from response 
    // check for user creation 
    // return res

    const {fullName, email, username, password} = req.body 
    console.log("email:", email);
// one by one bhi kar sakte but expert karte hen see below 
    // if(fullName === ""){
    //     throw new ApiError(400, "full name is required")
    // } 
    
    if(
        [fullName, email, username, password].some( (field)=> 
        field?.trim() === "")
    ){
     throw new ApiError(400, "All fields are required")
    }

   const existedUser = User.findOne({
        $or: [{username}, {email}]
    })
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    req.files?.avatar[0]?.path

} )

export {registerUser}