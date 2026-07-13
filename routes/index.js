const express = require("express");
const router = express.Router();
const authController = require("../controllers/adminAuthController");
const categoryController = require("../controllers/adminCategoryController");
const profileController = require("../controllers/adminProfileController");
const Category = require("../models/categoryModel");
const isAuth = require("../middleware/adminSessionMiddleware");
const upload = require("../middleware/profileImageUploadMiddleware");

const redirectIfAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    return next();
};

router.get("/", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    return res.redirect("/login");
});

router.get("/login", redirectIfAuthenticated, authController.loginPage);
router.post("/login", authController.signIn);
router.get("/register", redirectIfAuthenticated, authController.registerPage);
router.post("/register", authController.signUp);
router.get("/forgot-password", redirectIfAuthenticated, authController.forgotPasswordPage);
router.post("/forgot-password/send-otp", redirectIfAuthenticated, authController.requestForgotPasswordOtp);
router.post("/forgot-password/verify-otp", redirectIfAuthenticated, authController.verifyForgotPasswordOtp);
router.post("/forgot-password/resend-otp", redirectIfAuthenticated, authController.resendForgotPasswordOtp);
router.post("/forgot-password/reset", redirectIfAuthenticated, authController.resetForgotPassword);
router.get("/logout", authController.logout);

router.get("/dashboard", isAuth, async (req, res) => {
    const totalCategories = await Category.countDocuments();
    res.render("adminDashboard", { totalCategories, currentUser: req.user });
});

router.get("/profile", isAuth, profileController.profilePage);
router.post("/profile", isAuth, upload.single("profileImage"), profileController.updateProfile);
router.get("/change-password", isAuth, profileController.changePasswordPage);
router.post("/change-password", isAuth, profileController.changePassword);

router.get("/category/add", isAuth, categoryController.addCategoryPage);
router.post("/category/add", isAuth, categoryController.createCategory);
router.get("/categories", isAuth, categoryController.viewCategories);
router.get("/category/edit/:id", isAuth, categoryController.editCategoryPage);
router.post("/category/edit/:id", isAuth, categoryController.updateCategory);
router.post("/category/delete/:id", isAuth, categoryController.deleteCategory);

module.exports = router;
