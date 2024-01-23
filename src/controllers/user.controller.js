import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

//   local path of avatar and cover  images, req.files from multer 
// check for images , check for avatar
 const avatarLocalPath = req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;
 if(!avatarLocalPath){
throw new ApiError (400, "Avatar file is required");
 }

//  uploadimage on cloudinary 

const avatar = await uploadOnCloudinary (avatarLocalPath)
const coverImage = await uploadOnCloudinary (coverImageLocalPath)
if(!avatar){
    throw new ApiError(400, "Avatar file is required");
}

    // create user object - create entry in db 
const user = await User.create({
fullName,
avatar: avatar.url,
coverImage: coverImage?.url || "",
email,
 password,
 username: username.toLowerCase()
})
// check for user creation & remove password and refresh token field from response
const createdUser = await User.findById(user._id).select(
    // kya kya nahi chahiye 
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering a user")

}
// return res 
return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
)


} )

export {registerUser}