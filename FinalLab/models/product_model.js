const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    ID: Number,
    Description: String,
    Price: Number,
    Featured: { type: Boolean, default: false, required: true },
    picture: String, // Add this field if images are included
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to Category model
    quantity: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", ProductSchema);
