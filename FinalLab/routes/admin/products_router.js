const express = require("express")
let router = express()

const Product = require("../../models/product_model"); // Adjust path as necessary
const Category = require("../../models/category_model");
const Order = require("../../models/order_model"); // Import the Order model
const User = require("../../models/User");
const Admin = require("../../models/Admin");


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



router.post("/wishlist/add", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Please log in to add items to your wishlist." });
    }

    const { productId } = req.body;
    console.log("Session User ID:", req.session.userId);
    if (!req.session.userId) {
        return res.status(401).json({ message: "Please log in to add items to your wishlist." });
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
            return res.json({ success: true, message: "Product added to wishlist." });
        } else {
            return res.json({ success: false, message: "Product is already in your wishlist." });
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// View Wishlist
router.get("/wishlist", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    try {
        const user = await User.findById(req.session.userId).populate('wishlist');
        res.render("pages/main/wishlist", {layout:false, products: user.wishlist, layout: 'layout.ejs' });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.render("pages/main/wishlist", { products: [], error: "Error loading wishlist." });
    }
});

//Register
router.get('/register', (req, res) => {
    res.render('pages/user/register', { error: null, layout: false });
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if admin already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('pages/user/register', { 
                error: 'Email or username already exists', 
                layout: false 
            });
        }

       // Create new user
       const user = new User({ username, email, password });
       await user.save();

       res.redirect('/login'); // Redirect to login after successful registration
   } catch (error) {
       res.render('pages/user/register', { 
           error: 'An error occurred', 
           layout: false 
       });
   }
});

// Login Route
router.get('/login', (req, res) => {
   res.render('pages/user/login', { error: null, layout: false });
});

router.post('/login', async (req, res) => {
   try {
       const { email, password } = req.body;
       const user = await User.findOne({ email });
       
       if (!user) {
           return res.render('pages/user/login', { error: 'Invalid credentials', layout: false });
       }
       
       const isMatch = await user.comparePassword(password);
       if (!isMatch) {
           return res.render('pages/user/login', { error: 'Invalid credentials', layout: false });
       }
       
       req.session.userId = user._id; // Store user ID in session
       res.redirect('/user/dashboard'); // Redirect to user dashboard after successful login
   } catch (error) {
       res.render('pages/user/login', { error: 'An error occurred', layout: false });
   }
});

router.get("/user/dashboard",async(req,res)=>{
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    try {
        const user = await User.findById(req.session.userId).populate('wishlist');
        res.render('pages/user/user_dashboard', { user, products: user.wishlist, layout: false });
    } catch (error) {
        console.error("Error fetching user dashboard:", error);
        res.render('pages/user/user_dashboard', { user: {}, products: [], error: "Error loading dashboard." });
    }})

// Logout Route
router.get('/logout', (req, res) => {
   req.session.destroy();
   res.redirect('pages/user/login');
});



// Check Authentication Route
router.get('/user/check-auth', (req, res) => {
    if (req.session.userId) {
        return res.status(200).json({ message: "User  is authenticated." });
    } else {
        return res.status(401).json({ message: "User  is not authenticated." });
    }
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