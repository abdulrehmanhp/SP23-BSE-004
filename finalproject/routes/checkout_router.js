const express = require("express");
const router = express.Router();
const Order = require("../models/order_model");
const Product = require("../models/product_model");

router.get("/checkout/shipping", async (req, res) => {
    try {
        const cart = req.cookies.cart || [];
        
        // If cart is empty, redirect to cart page
        if (!cart.length) {
            return res.redirect('/cart');
        }

        // Get cart items for display
        const cartItems = await Promise.all(
            cart.map(async (item) => {
                const product = await Product.findById(item.productId);
                return {
                    ...product.toObject(),
                    quantity: item.quantity,
                    subtotal: product.Price * item.quantity
                };
            })
        );

        const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

        res.render("pages/checkout/shipping", { 
            layout: 'layout.ejs',
            cartItems,
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Error loading shipping page:', error);
        res.redirect('/cart');
    }
});

router.post("/checkout/shipping", async (req, res) => {
    try {
        const cart = req.cookies.cart || [];
        if (!cart.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const { name, address, city, country, postal } = req.body;

        // Validate shipping info
        if (!name || !address || !city || !country || !postal) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const shippingInfo = {
            name,
            address,
            city,
            country,
            postal
        };

        // Store shipping info in cookie
        res.cookie('shippingInfo', shippingInfo, { 
            maxAge: 900000, 
            httpOnly: true 
        });

        // Calculate total for payment page
        const products = await Promise.all(
            cart.map(async (item) => {
                const product = await Product.findById(item.productId);
                return {
                    ...product.toObject(),
                    quantity: item.quantity,
                    subtotal: product.Price * item.quantity
                };
            })
        );

        const total = products.reduce((sum, product) => sum + product.subtotal, 0);

        res.status(200).json({ 
            success: true, 
            redirect: '/checkout/payment',
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Error processing shipping info:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get("/checkout/payment", async (req, res) => {
    try {
        const cart = req.cookies.cart || [];
        const shippingInfo = req.cookies.shippingInfo;

        if (!shippingInfo) {
            return res.redirect("/checkout/shipping");
        }

        if (!cart.length) {
            return res.redirect('/cart');
        }

        // Calculate total
        const products = await Promise.all(
            cart.map(async (item) => {
                const product = await Product.findById(item.productId);
                return {
                    ...product.toObject(),
                    quantity: item.quantity,
                    subtotal: product.Price * item.quantity
                };
            })
        );

        const total = products.reduce((sum, product) => sum + product.subtotal, 0);

        res.render("pages/checkout/payment", { 
            layout: 'layout.ejs',
            shippingInfo,
            total: total.toFixed(2),
            products
        });
    } catch (error) {
        console.error('Error loading payment page:', error);
        res.redirect('/cart');
    }
});

router.post("/checkout/process-payment", async (req, res) => {
    try {
        console.log('Payment request received:', req.body); // Debug log

        const cart = req.cookies.cart || [];
        const shippingInfo = req.cookies.shippingInfo;
        const { paymentMethod, totalAmount } = req.body;

        // Validate required data
        if (!cart.length || !shippingInfo || !paymentMethod) {
            console.log('Missing required data:', { cart, shippingInfo, paymentMethod }); // Debug log
            return res.status(400).json({ error: 'Missing required data' });
        }

        // Calculate final total
        const products = await Promise.all(
            cart.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                return {
                    product: item.productId,
                    quantity: item.quantity,
                    price: product.Price,
                    subtotal: product.Price * item.quantity
                };
            })
        );

        const calculatedTotal = products.reduce((sum, item) => sum + item.subtotal, 0);
        console.log('Order total:', calculatedTotal); // Debug log

        // Create order
        const order = new Order({
            products: products.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price
            })),
            shippingInfo,
            paymentInfo: {
                method: paymentMethod,
                status: "completed",
                cardLastFour: paymentMethod === 'credit_card' ? 
                    req.body.cardNumber.slice(-4) : null
            },
            status: "processing",
            totalAmount: calculatedTotal,
            orderDate: new Date()
        });

        // Save order
        const savedOrder = await order.save();
        console.log('Order saved:', savedOrder._id); // Debug log

        if (!savedOrder) {
            throw new Error('Failed to create order');
        }

        // Clear cart and shipping cookies
        res.clearCookie('cart');
        res.clearCookie('shippingInfo');

        // Send success response
        res.json({
            success: true,
            redirect: `/checkout/confirmation/${savedOrder._id}`
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            error: 'Payment processing failed. Please try again.',
            details: error.message
        });
    }
});

router.get("/checkout/confirmation/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('products.product');
        
        if (!order) {
            console.error('Order not found:', req.params.orderId);
            return res.redirect('/cart');
        }

        res.render("pages/checkout/confirmation", { 
            layout: 'layout.ejs',
            order,
            orderDate: order.orderDate.toLocaleDateString(),
            orderTime: order.orderDate.toLocaleTimeString()
        });
    } catch (error) {
        console.error('Error loading confirmation:', error);
        res.redirect('/cart');
    }
});

module.exports = router; 