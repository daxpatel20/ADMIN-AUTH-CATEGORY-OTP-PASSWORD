const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            trim: true
        },
        normalizedCategoryName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        }
    },

);

categorySchema.pre("validate", function (next) {
    if (this.categoryName) {
        this.categoryName = this.categoryName.trim();
        this.normalizedCategoryName = this.categoryName.toLowerCase();
    }

    next();
});

module.exports = mongoose.model("Category", categorySchema);
