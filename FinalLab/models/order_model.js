const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        description: String,
        quantity: Number,
        price: Number
    }],
    shippingInfo: {
        
        country: String,
        postal: String
    },
    paymentInfo: {
        method: String,
        status: String,
        cardLastFour: String
    },
      
    status: String,
    totalAmount: Number,
    orderDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", orderSchema); 




