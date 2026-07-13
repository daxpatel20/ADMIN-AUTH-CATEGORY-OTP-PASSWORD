const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const deleteOldProfileImage = (imagePath) => {
    if (!imagePath) return;

    const fileName = imagePath.replace("/uploads/", "").replace("/public/uploads/", "");
    const fullPath = path.join(__dirname, "..", "public", "uploads", fileName);

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/;
const passwordConditionMessage = "Password must be 8 to 15 characters with capital letter, small letter, number and special character";

const profilePage = (req, res) => {
    res.render("adminProfile", {
        success: req.query.success ? "Profile updated successfully" : null,
        error: null
    });
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.redirect("/logout");
        }

        const name = req.body.name ? req.body.name.trim() : "";

        if (!name) {
            return res.render("adminProfile", {
                success: null,
                error: "Name is required"
            });
        }

        user.name = name;
        user.birthYear = req.body.birthYear ? req.body.birthYear.trim() : "";
        user.gender = req.body.gender ? req.body.gender.trim() : "";
        user.country = req.body.country ? req.body.country.trim() : "";
        user.state = req.body.state ? req.body.state.trim() : "";
        user.address = req.body.address ? req.body.address.trim() : "";
        user.facebook = req.body.facebook ? req.body.facebook.trim() : "";
        user.instagram = req.body.instagram ? req.body.instagram.trim() : "";
        user.linkedin = req.body.linkedin ? req.body.linkedin.trim() : "";
        user.github = req.body.github ? req.body.github.trim() : "";

        if (req.file) {
            deleteOldProfileImage(user.profileImage);
            user.profileImage = "/uploads/" + req.file.filename;
        }

        const updatedUser = await user.save();

        req.login(updatedUser, (loginErr) => {
            if (loginErr) {
                return res.render("adminProfile", {
                    success: null,
                    error: "Profile updated, but session refresh failed"
                });
            }

            return res.redirect("/profile?success=1");
        });
    } catch (error) {
        console.error("Profile update error", error);
        return res.render("adminProfile", {
            success: null,
            error: "Profile update failed"
        });
    }
};

const changePasswordPage = (req, res) => {
    res.render("adminChangePassword", {
        success: null,
        error: null
    });
};

const changePassword = async (req, res, next) => {
    try {
        let { oldPassword, newPassword, confirmPassword } = req.body;

        oldPassword = oldPassword ? oldPassword.trim() : "";
        newPassword = newPassword ? newPassword.trim() : "";
        confirmPassword = confirmPassword ? confirmPassword.trim() : "";

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.render("adminChangePassword", {
                success: null,
                error: "Please fill all password fields"
            });
        }

        if (!passwordRegex.test(newPassword)) {
            return res.render("adminChangePassword", {
                success: null,
                error: passwordConditionMessage
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render("adminChangePassword", {
                success: null,
                error: "New password and confirm password do not match"
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.redirect("/logout");
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.render("adminChangePassword", {
                success: null,
                error: "Old password is incorrect"
            });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);

        if (isSamePassword) {
            return res.render("adminChangePassword", {
                success: null,
                error: "New password must be different from old password"
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        req.logout((logoutErr) => {
            if (logoutErr) return next(logoutErr);

            req.session.destroy((sessionErr) => {
                if (sessionErr) return next(sessionErr);

                res.clearCookie("connect.sid");
                return res.redirect("/login?passwordChanged=1");
            });
        });
    } catch (error) {
        console.error("Change password error", error);
        return res.render("adminChangePassword", {
            success: null,
            error: "Password change failed"
        });
    }
};

module.exports = {
    profilePage,
    updateProfile,
    changePasswordPage,
    changePassword
};
