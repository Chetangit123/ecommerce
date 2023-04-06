const app = require("./app");
const dotenv = require("dotenv");
const coludinary = require("cloudinary")
const connectDatabase = require("./config/database");

//Handling uncaught Exceptions
process.on("uncaughtException",(err)=>{
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to unhandled promise rejection`);
})

//config
dotenv.config({path:'backend/config/config.env'})

//connecting/calling database
connectDatabase();

coludinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
})

//Unhandled Promise Rejection
process.on("unhandledRejection",err=>{
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server");

    server.close(()=>{
        process.exit(1)
    })
})