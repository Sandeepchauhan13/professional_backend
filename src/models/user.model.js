import mongoose, {Schema} from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
const userSchema = new Schema(
 
    {
  username: {
    type: String,
     required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  avatar: {
    type: String, //cloudinary url
    required: true,
  },
  
  coverImage: {
    type: String, //cloudinary url
  },
  watchHistory: [
    {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true, 'password is required']
  },
  refreshToken: {
    type: String
  }

},
 {
    // createdat and updatedat mil hi jayega 
    timestamps: true
}
)

// ye logic password encrypt kar dega 
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
  return await  bcrypt.compare(password, this.password)
}

// jwt is a bearer token ye token jiske paas hai usko data send kar deta hai is like a key
// generate access and refresh token 
userSchema.methods.generateAccessToken = function() {
  // jwt ke paas ek sign method hai which generate token 
return jwt.sign(
{
   _id: this._id,
   email: this.email,
   user: this.username,
   fullName: this.fullName
},
process.env.ACCESS_TOKEN_SECRET,
{
  expiresIn : process.env.ACCESS_TOKEN_EXPIRY
}
)
}
userSchema.methods.generateRefreshToken = function() {
  
  return jwt.sign(
      {
           _id: this._id,
         
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
          expiresIn : process.env.REFRESH_TOKEN_EXPIRY
      }
      )
}

export const User = mongoose.model("User", userSchema)