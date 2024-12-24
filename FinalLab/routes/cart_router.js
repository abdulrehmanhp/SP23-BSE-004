const express = require("express");
const router = express.Router();
const Product = require("../models/product_model");

// Get cart total
router.get("/cart/total", (req, res) => {
    const cart = req.cookies.cart || [];
    // Make sure cart is an array before using reduce
    const total = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    res.json({ total });
});

// Get cart count
router.get("/cart/count", (req, res) => {
    const cart = req.cookies.cart || [];
    // Make sure cart is an array before getting length
    const count = Array.isArray(cart) ? cart.length : 0;
    res.json({ count });
});

// Add to cart
router.post("/cart/add", async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    let cart = req.cookies.cart || [];
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        cart.push({ productId, quantity: parseInt(quantity) });
    }
    
    // Calculate total items in cart
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    res.cookie('cart', cart, { maxAge: 900000, httpOnly: true });
    res.json({ success: true, cartSize: itemCount });
});

// View cart
router.get("/cart", async (req, res) => {
    try {
        const cartItems = req.cookies.cart || [];
        
        // If cart is empty, render empty cart page
        if (!cartItems.length) {
            return res.render("pages/cart/cart", { 
                products: [], 
                total: 0,
                layout: 'layout.ejs'
            });
        }

        const products = await Promise.all(
            cartItems.map(async (item) => {
                const product = await Product.findById(item.productId).populate('category');
                if (!product) return null;
                return {
                    ...product.toObject(),
                    quantity: item.quantity,
                    subtotal: product.Price * item.quantity
                };
            })
        );

        // Filter out any null products (in case a product was deleted)
        const validProducts = products.filter(p => p !== null);
        const total = validProducts.reduce((sum, product) => sum + product.subtotal, 0);

        res.render("pages/cart/cart", { 
            products: validProducts, 
            total,
            layout: 'layout.ejs'
        });
    } catch (error) {
        console.error('Error loading cart:', error);
        res.render("pages/cart/cart", { 
            products: [], 
            total: 0,
            layout: 'layout.ejs',
            error: 'Error loading cart. Please try again.'
        });
    }
});

// Update quantity
router.post("/cart/update-quantity", (req, res) => {
    const { productId, quantity } = req.body;
    let cart = req.cookies.cart || [];
    
    if (parseInt(quantity) === 0) {
        // Remove item if quantity is 0
        cart = cart.filter(item => item.productId !== productId);
    } else {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = parseInt(quantity);
        }
    }
    
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    res.cookie('cart', cart, { maxAge: 900000, httpOnly: true });
    res.json({ success: true, cartSize: itemCount });
});

// Get cart preview
router.get("/cart/preview", (req, res) => {
    const cart = req.cookies.cart || [];
    // Make sure cart is an array
    const products = Array.isArray(cart) ? cart : [];
    const total = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ products, total });
});

module.exports = router; 