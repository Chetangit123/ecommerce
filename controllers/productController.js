const Product = require("../models/productModel");
const Errorhander = require("../utils/errorhander");
const catchAsyncErros = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");

//Create Product --Admin
exports.creteProduct = catchAsyncErros(async (req, res, next) => {
  req.body.user = req.user.id;
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

//Get All Product

exports.getAllProducts = catchAsyncErros(async (req, res, next) => {
  // console.log("this is");
  // return next(new Errorhander("This is Error",  500) )
 

  const resultPerPage = 4;
  const productsCount = await Product.countDocuments();
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    
    let products = await apiFeature.query;

    let filteredProductsCount = products.length

    apiFeature.pagination(resultPerPage);
    
    products = await apiFeature.query.clone();

    console.log(products);
  res.status(200).json({
    sucess: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

//Get single product

exports.getProductDetails = catchAsyncErros(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new Errorhander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

//Update Product --Admin

exports.updateProduct = catchAsyncErros(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new Errorhander("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

//Delete Product

exports.deleteProduct = catchAsyncErros(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new Errorhander("Product not found", 404));
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

//Create New review or update existing review
exports.createProductReview = catchAsyncErros(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.body.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === review.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === review.user._id.toString()) 
      (rev.rating = rating), (rev.comment = comment);
      
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev)=>{
    avg+=rev.rating;

  })

  product.ratings = avg / product.reviews.length;
  await product.save({validateBeforeSave: false});
  
  res.status(201).json({
  
    success: true,
    message: "Review Added Successfully",
    review,
    avg,})
});

//Get All Reviews

exports.getProductReviews = catchAsyncErros(async (req, res,next) => {
    const product = await Product.findById(req.query.id);

    if(!product){
    return next(new Errorhander("Product not found", 404))
    
    }
    console.log(product.ratings);
    res.status(200).json({
      success: true,
      reviews: product.reviews,
      
    });


})

//Delete review
exports.deleteReview = catchAsyncErros(async (req, res, next) =>{
    const product = await Product.findById(req.query.productId);
    if(!product){
        return next(new Errorhander("Product not found", 404))
    }

    const reviews = product.reviews.filter((rev)=>rev._id.toString() !== req.query.id.toString())

    let avg = 0;

    reviews.forEach((rev)=>{
      avg += rev.rating;
  
    })

   let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

    const numOfReviews = reviews.length;
 
    
  await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        ratings,
        numOfReviews,
        
    }
    ,{
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    console.log("working...");

    res.status(200).json({
        success: true,
      
    })

})
