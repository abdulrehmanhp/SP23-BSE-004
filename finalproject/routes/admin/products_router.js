const express = require("express")
let router = express()

const Product = require("../../models/product_model"); // Adjust path as necessary
const Category = require("../../models/category_model");
const Order = require("../../models/order_model"); // Import the Order model

let multer = require("multer");

const storage = multer.diskStorage({
    destination: function(req , file , cb){
        cb(null,"./uploads")
    },
    filename: function(req , file , cb){
        cb(null, `${Date.now()}-${file.originalname}`)
    }
  })
  
  const upload = multer({ storage: storage });


  router.get("/admin", async (req, res) => {
    const products = await Product.find().populate('category'); // Fetch all products and populate category
    const totalProducts = products.length; // Total number of products
   // Fetch total revenue from completed orders
   const orders = await Order.find(); // Fetch all orders
   const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0); // Sum of total amounts from orders
// Fetch total orders
    const totalOrders = await Order.countDocuments(); // Count total orders

    res.render("pages/admin/dashboard", { layout: "admin-layout.ejs",products,totalProducts,
        totalRevenue: totalRevenue.toFixed(), // Format to 2 decimal places
        totalOrders,orders }); // Render dashboard.ejs
});

    //Product Creation
  router.post("/admin/products/create",upload.single("file"), async (req, res) => {
     
      const newProduct = new Product(req.body);
       req.body.Featured = req.body.Featured === "true";
       newProduct.quantity = parseInt(req.body.quantity);
      if (req.file) newProduct.picture = req.file.filename;
     await newProduct.save();
  
      return res.redirect("/admin/products");
  });





router.get("/admin/products/create", async (req, res) => {
    let categories = await Category.find(); // Fetch all categories
    res.render("pages/admin/form", { categories , layout:false }); // Pass categories to the form
});

//Product Deletion
router.get("/admin/product/delete/:id", async (req,res)=>{
    await Product.findByIdAndDelete(req.params.id);
    return res.redirect("/admin/products");
})

//Product Update
router.get("/admin/product/edit/:id", async(req,res)=>{
    let product = await Product.findById(req.params.id)
    let categories = await Category.find(); // Fetch all categories
    res.render("pages/admin/editForm", {
        layout: "admin-layout.ejs",product,categories // Pass categories to the form
    });
})

router.post("/admin/product/edit/:id", async(req,res)=>{
    let product = await Product.findById(req.params.id)
    product.Description = req.body.Description
    product.Price = req.body.Price
    product.Featured = Boolean(req.body.Featured)
    product.quantity = parseInt(req.body.quantity); // Update quantity from form input
    if (req.body.category) {
        product.category = req.body.category;// Update the category
     } 
    if (req.file) product.picture = req.file.filename;
    await product.save()
    res.redirect("/admin/products")
})


//Category Portion
router.get("/admin/categories", async(req,res)=>{
    let category = await Category.find();
    res.render("pages/admin/category",{layout: "admin-layout", category});

})

//Category Creation
router.get("/admin/categories/createCategory", async(req,res)=>{
    res.render("pages/admin/create_category",{layout: "admin-layout", Category});
})

router.post("/admin/categories/createCategory",async (req,res)=>{
    let categoryProduct = new Category(req.body);
    categoryProduct.In_Stock = Boolean(req.body.In_Stock);
    await categoryProduct.save();
    res.redirect("/admin/categories");
})

//Category Deletion
router.get("/admin/categories/delete/:id", async(req,res)=>{
    await Category.findByIdAndDelete(req.params.id)
    res.redirect("back")
})

//Category Update
router.get("/admin/categories/edit/:id", async(req,res)=>{
    let category = await Category.findById(req.params.id)
    res.render("pages/admin/edit_category",{layout:"admin-layout.ejs",category});
})

router.post("/admin/categories/edit/:id", async (req,res)=>{
    let category = await Category.findById(req.params.id);
    category.category = req.body.category;
    await category.save();
    return res.redirect("/admin/categories");
})


//Pagenation
router.get("/admin/products", async (req, res) => {
    const page = parseInt(req.query.page || "1"); // Default to 1 if page is not provided
    const limit = 5; 
    const skip = (page - 1) * limit; // Calculate items to skip
    const sortBy = req.query.sort || 'default';//Sort by default

    const filter = req.query.filter || 'all'; // Get filter from query parameters

    let filterOptions = {};
    if (filter === 'Featured') {
        filterOptions.Featured = true; // Filter for featured products
    } else if (filter === 'Standard') {
        filterOptions.Featured = false; // Filter for standard products
    }


    let sortOptions = {};
    if (sortBy === 'price') {
        sortOptions.Price = 1; // Ascending order
    } else if (sortBy === 'quantity') {
        sortOptions.quantity = 1; // Ascending order
    } // Default sorting can be handled as needed

     const products = await Product.find(filterOptions)
        .populate('category') // Populate the category field
        .sort(sortOptions) // Apply sorting
        .skip(skip)
        .limit(limit); // Paginated products
        const total = await Product.countDocuments(); // Total number of products
        res.render("pages/admin/product", {
            layout: "admin-layout.ejs",
            products,
            currentPage: page, // Pass current page
            totalPages: Math.ceil(total / limit), // Pass total pages
            sortBy, // Pass the sort option to the view
            filter // Pass the filter option to the view
    });
   
});


module.exports=router