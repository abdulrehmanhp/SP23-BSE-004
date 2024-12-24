const mongoose = require("mongoose");
// make a schema
let categorySchema = new mongoose.Schema({
  category: String, // All WOmen
  slug: String, //all-women
});
//model
let Category = mongoose.model("Category", categorySchema);
//export model
module.exports = Category;
