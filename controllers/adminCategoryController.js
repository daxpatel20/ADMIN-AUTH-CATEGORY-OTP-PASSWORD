const Category = require("../models/categoryModel");

const normalizeCategory = (value) => (value || "").trim().toLowerCase();

const addCategoryPage = (req, res) => {
    res.render("categoryAddPage", {
        error: null,
        success: req.query.success || null,
        formData: {}
    });
};

const createCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName ? req.body.categoryName.trim() : "";

        if (!categoryName) {
            return res.render("categoryAddPage", {
                error: "Category name is required.",
                success: null,
                formData: { categoryName }
            });
        }

        const alreadyExists = await Category.findOne({ normalizedCategoryName: normalizeCategory(categoryName) });

        if (alreadyExists) {
            return res.render("categoryAddPage", {
                error: "Category already register.",
                success: null,
                formData: { categoryName }
            });
        }

        await Category.create({ categoryName });
        return res.redirect("/category/add?success=Category added successfully");
    } catch (error) {
        if (error && error.code === 11000) {
            return res.render("categoryAddPage", {
                error: "Category already register.",
                success: null,
                formData: req.body || {}
            });
        }

        return res.render("categoryAddPage", {
            error: "Category not added. Please try again.",
            success: null,
            formData: req.body || {}
        });
    }
};

const viewCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return res.render("categoryListPage", {
            categories,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        return res.render("categoryListPage", {
            categories: [],
            success: null,
            error: "Unable to load category data."
        });
    }
};

const editCategoryPage = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.redirect("/categories?error=Category not found");

        return res.render("categoryEditPage", {
            category,
            error: null
        });
    } catch (error) {
        return res.redirect("/categories?error=Invalid category");
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName ? req.body.categoryName.trim() : "";
        const category = await Category.findById(req.params.id);

        if (!category) return res.redirect("/categories?error=Category not found");

        if (!categoryName) {
            return res.render("categoryEditPage", {
                category: { ...category.toObject(), categoryName },
                error: "Category name is required."
            });
        }

        const alreadyExists = await Category.findOne({
            _id: { $ne: req.params.id },
            normalizedCategoryName: normalizeCategory(categoryName)
        });

        if (alreadyExists) {
            return res.render("categoryEditPage", {
                category: { ...category.toObject(), categoryName },
                error: "Category already register."
            });
        }

        category.categoryName = categoryName;
        category.normalizedCategoryName = normalizeCategory(categoryName);
        await category.save();

        return res.redirect("/categories?success=Category updated successfully");
    } catch (error) {
        if (error && error.code === 11000) {
            return res.redirect("/categories?error=Category already register");
        }

        return res.redirect("/categories?error=Category not updated");
    }
};

const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        return res.redirect("/categories?success=Category deleted successfully");
    } catch (error) {
        return res.redirect("/categories?error=Category not deleted");
    }
};

module.exports = {
    addCategoryPage,
    createCategory,
    viewCategories,
    editCategoryPage,
    updateCategory,
    deleteCategory
};
