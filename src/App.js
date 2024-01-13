import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express ()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// data come in the form of json etc form  eetc for this use this setting 
app.use(express.json({limit: "16kb"}))
// url encoder convert just like space ka url encoder %20 
// extended object ke andar object nested ,limit 
app.use(express.urlencoded({extended: true, limit: "16kb"}))

// public assets for pdf image favicon etc 
app.use(express.static("public"))

// server se user ki cookies access and set thats the work of cookieparser 
app.use(cookieParser())

// routes import 
import userRouter from './routes/user.routes.js';

// routes declaration 
app.use("/api/v1/users", userRouter)
// app.use("/users", userRouter)

// http://localhost:8000/api/v1/users/register


export { app }