import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
// register user method 
// asynchandler higher order function jo accept krta hia function ko 

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
       const user =  await User.findById(userId)
    //    generate access token and generate refresh token are methods 

      const accessToken =  user.generateAccessToken ()
       const refreshToken = user.generateRefreshToken()
       user.refreshToken = refreshToken 
          await user.save({validateBeforeSave: false})
          return {accessToken, refreshToken}
    }catch(error){
        throw  new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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
    // console.log("email:", email);
// one by one bhi kar sakte but expert karte hen see below 
    // if(fullName === ""){
    //     throw new ApiError(400, "full name is required")
    // } 
    
    if(
        [fullName, email, username, password].some((field)=> 
        field?.trim() === "")
    ){
     throw new ApiError(400, "All fields are required")
    }

   const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
  // console.log(req.files);
// localpath of avatar and cover image avatar local path is mandatory 
// req.files from   multer // check for images , check for avatar
const avatarLocalPath = req.files?.avatar[0]?.path;
//  const coverImageLocalPath = req.files?.coverImage[0]?.path;

// here some times error occures due to ?  mark"coverImage": "", coverimage ess tareke se aayegi by this code
// if we dont send coverimage error will not come 
 let coverImageLocalPath;
 if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
 }

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

// this is for access token logics 
 const loginUser = asyncHandler(async (req, res)=>{

     // req body -> data
     // check for username or email 
     // find the user
     // password check
     // access and refresh token
     // send cookie 

    //  step1 req body data 
    const {username, password, email}=req.body

    // check for username and email 
    // if(!username || !email){
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    // step 3 find the user 
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "user doesn't exist ")
    }

    // step4 password check
    const isPasswordValid =  await user.isPasswordCorrect(password)
    if(!isPasswordValid){
       throw new ApiError(401, "Invalid user credentials")
    }

    

    // step5 access and refresh token & cookie
const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
const options = {
    httpOnly: true,
    secure: true
}
return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken,
            refreshToken
        },
        "User logged in Successfully"
    )
)


 })
const logoutUser = asyncHandler(async(req, res)=>{
    // first step find user  find by id kha se leke aayu  middleware use karenge 
    await User.findByIdAndUpdate(
        req.user._id,
        {
          $set:  {
            refreshToken: undefined
          }
        },
        {
          new: true
        }
      )
      const options = {
        httpOnly: true,
        secure: true
      }
      return res
      .status(200)
      .clearCookie("accessToken", options )
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"))
})

// refresh token code 
const refreshAccessToken = asyncHandler(async(req, res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
   }


   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
 
    )
 //    mongodb se query maar ke mongodb se  access 
 const user = await User.findById(decodedToken?._id)
 if(!user){
     throw new ApiError(401, "Invalid refresh token")
 }
 if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError (401, "Refresh token is expired or used")
 }
 const  options  = {
     httpOnly:  true,
     secure: true
 }
 
 const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens  (user._id)
 return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options)
 .json(
     new ApiError(
         200,
         {accessToken, refreshToken: newRefreshToken},
         "Access token refreshed"
     )
 )
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
    
   }
})

// change   current password 
const changeCurrentPassword = asynHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body
    // confirmpassword logic 
    // const {oldPassword, newPassword, confPassword} = req.body

    // if(!(newPassword === confPassword)){
        // throw new ApiError(400. "new password is not same as conf password ")
    // }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(new ApiResponse(200, {}, "Passwoed changed successfully"))
})


// get current user 
const getCurrentUser = asyncHandler(async(req, res)=>{
    // user is already in middleware just return it 
    return res.status(200).json(200, req.user, "current user fetched successfully")
})

// update account details 
const updateAccountDetails =  asyncHandler(async(req, res)=>{
    const {fullName, email}= req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id,{$set: {fullName, email: email}}, {new: true}).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
});


// update avatar  object update ho ra hai
const updateUserAvatar = asyncHandler(async(req, res)=>{
// req.files lia tha middle ware main  
const avatarLocalPath = req.file?.path
if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
}
const avatar = await uploadOnCloudinary
(avatarLocalPath)
if(!avatar.url){
throw new ApiError(400, "Error while uploading avatar")
}
const user = await User.findByIdAndUpdate(req.user?._id, {$set:{avatar: avatar}}, {new: true}).select("-password")
return res.status(200).json(
    new ApiResponse(200, user, "Cover image updated successfully")
)

})


// update  coverImage 
const updateUserCoverImage = asyncHandler(async(req, res)=>{
    // req.files lia tha middle ware main  
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary
    (coverImageLocalPath)
    if(!coverImage.url){
    throw new ApiError(400, " uploading avatar")
    }
  const user =  await User.findByIdAndUpdate(req.user?._id,
     {
        $set:{coverImage: coverImage.url}
    }, 
    {new: true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
    })
    



export {registerUser, loginUser, logoutUser, refreshAccessToken,
     changeCurrentPassword, getCurrentUser, updateAccountDetails,
    updateUserAvatar, updateUserCoverImage}