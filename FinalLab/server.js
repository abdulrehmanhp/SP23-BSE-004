const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const Admin = require('./models/Admin');
const session = require('express-session');
const Order = require('./models/order_model');

const app = express();
const expresslayouts = require("express-ejs-layouts");

// Set up EJS
app.use(expresslayouts);
app.set("view engine", "ejs");

// Middleware
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse form data

// Add session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Middleware to check if admin is authenticated
const isAdminAuthenticated = (req, res, next) => {
    if (req.session.adminId) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// MongoDB Connection
const connectionString = "mongodb://127.0.0.1:27017/J"; // Use 127.0.0.1 for IPv4

mongoose.connect(connectionString)
    .then(() => {
        console.log("Database Connected");
    })
    .catch((err) => {
        console.error("Error Connecting to MongoDB:", err.message);
    });

const Product = require("./models/product_model"); // Import the Product model





const routers =require("./routes/admin/products_router");
const cartRoutes = require("./routes/cart_router");
const checkoutRoutes = require("./routes/checkout_router");

app.use(routers)
app.use(cartRoutes)
app.use(checkoutRoutes)

// Admin routes
app.get('/admin', (req, res) => {
    if (req.session.adminId) {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

app.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: null, layout: false });
});

app.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return res.render('admin/login', { error: 'Invalid credentials', layout: false });
        }
        
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.render('admin/login', { error: 'Invalid credentials', layout: false });
        }
        
        req.session.adminId = admin._id;
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.render('admin/login', { error: 'An error occurred', layout: false });
    }
});

app.get('/admin/register', (req, res) => {
    res.render('admin/register', { error: null, layout: false });
});

app.post('/admin/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
        if (existingAdmin) {
            return res.render('admin/register', { 
                error: 'Email or username already exists', 
                layout: false
            });
        }
        
        // Create new admin
        const admin = new Admin({ username, email, password });
        await admin.save();
        
        res.redirect('/admin/login');
    } catch (error) {
        res.render('admin/register', { 
            error: 'An error occurred', 
            layout: false
        });
    }
});

app.get('/admin/dashboard', isAdminAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId);
        const products = await Product.find().populate('category');
        const totalProducts = products.length;
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const totalOrders = orders.length;

        res.render('admin/dashboard', {
            layout: "admin-layout.ejs",
            admin,
            products,
            totalProducts,
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders,
            orders
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/admin/login');
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Other Routes
app.get("/", (req, res) => {
    res.render("pages/main/landingpage");
});

app.get("/women", async (req, res) => {
    
        const products = await Product.find().populate('category'); // Fetch all products and populate category
        res.render("pages/main/women", { products});
   
});



// Start Server
app.listen(5001, () => {
    console.log("Server running on port 5001");
});
