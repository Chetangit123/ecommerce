const Errorhander = require("../utils/errorhander");
const catchAsyncErros = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

//Register a user
exports.registerUser = catchAsyncErros(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,

      url: myCloud.secure_url,
    },
  });

  sendToken(user, 201, res);
});

//Login User

exports.loginUser = catchAsyncErros(async (req, res, next) => {
  const { email, password } = req.body;

  //Checking if user has given email and password both

  if (!email || !password) {
    return next(new Errorhander("Please Enter Email & Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new Errorhander("Invalid email or Password", 401));
  }
  const isPasswordMAtched = await user.comparePassword(password);

  if (!isPasswordMAtched) {
    return next(new Errorhander("Invalid email or Password", 401));
  }

  sendToken(user, 200, res);
});

//Logout User
exports.logout = catchAsyncErros(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

//Forgot PAssword

exports.forgotPassword = catchAsyncErros(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new Errorhander("User not found", 404));
  }

  //Get ResetPassword token

  const resetToken = user.getresetPasswordToken();


  await user.save({ validateBeforeSave: false });

  //    const resetPasswordUrl = `http://localhost/api/v1/password/reset/${resettoken}`

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/password/reset/${resetToken}`;

  const message = `Your Password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email ,please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: "BigBuccket Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new Errorhander(error.message, 500));
  }
});

//Reset PAssword

exports.resetPassword = catchAsyncErros(async (req, res, next) => {
  //creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new Errorhander(
        "Reset Password token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new Errorhander("Password doesnot match with confirm password", 400)
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

//Get User Details

exports.getUserDetails = catchAsyncErros(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

//Update User Password

exports.updatePassword = catchAsyncErros(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMAtched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMAtched) {
    return next(new Errorhander("Old Password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(
      new Errorhander("New Password and Confirm Password is not matched", 400)
    );
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

//Update User Profile

exports.updateProfile = catchAsyncErros(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  

  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }



  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

//get All users for admin to see

exports.getAllUsers = catchAsyncErros(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

//get single user for admin to see

exports.getSingleUser = catchAsyncErros(async (req, res, next) => {
  const user = await User.findById();
  if (!user) {
    return next(
      new Errorhander(`User does not exists with Id : ${req.params.id}`)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

//Update User Role - Admin

exports.updateUserRole = catchAsyncErros(async (req, res, next) => {
  const newuserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newuserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

//Delete User --Admin

exports.deleteUser = catchAsyncErros(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  //We will remove cloudinary later
  if (!user) {
    return next(
      new Errorhander(`User does not exists with Id : ${req.params.id}`)
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
