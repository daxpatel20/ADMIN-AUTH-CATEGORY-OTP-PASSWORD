const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const passport = require("../middleware/passport");
const otpGenerator = require("otp-generator");
const { v4: uuidv4 } = require("uuid");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/;
const passwordConditionMessage = "Password must be 8 to 15 characters with capital letter, small letter, number and special character";
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 30 * 1000;

const clean = (value) => (value ? String(value).trim() : "");
const normalizeEmail = (value) => clean(value).toLowerCase();
const isExpired = (date) => !date || Date.now() > new Date(date).getTime();

const generateOtp = () => otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true
});

const renderForgotView = (res, data = {}) => {
    return res.render("adminForgotPassword", {
        error: null,
        success: null,
        email: "",
        token: "",
        step: "email",
        openOtpModal: false,
        resendSeconds: 0,
        ...data
    });
};

const loginPage = (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    res.render("adminSignin", { error: null, success: req.query.passwordChanged ? "Password changed successfully. Please login again." : null });
};

const registerPage = (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    res.render("adminSignup", { error: null });
};

const forgotPasswordPage = (req, res) => renderForgotView(res);

const requestForgotPasswordOtp = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return renderForgotView(res, { error: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return renderForgotView(res, { error: "This email is not registered.", email });
        }

        const otp = generateOtp();
        const token = uuidv4();
        const now = Date.now();

        user.forgotPasswordOtp = String(otp);
        user.forgotPasswordToken = String(token);
        user.forgotPasswordOtpExpires = new Date(now + OTP_EXPIRY_MS);
        user.forgotPasswordResendAt = new Date(now + OTP_RESEND_MS);
        user.forgotPasswordVerified = false;
        await user.save();

        console.log(`OTP: ${otp}`);

        return renderForgotView(res, {
            success: "OTP generated successfully. Check the server console.",
            email,
            token,
            step: "otp",
            openOtpModal: true,
            resendSeconds: 30
        });
    } catch (error) {
        console.error("Forgot password OTP error", error.message);
        return renderForgotView(res, { error: "Unable to generate OTP. Please try again." });
    }
};

const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const token = clean(req.body.token);
        const otp = clean(req.body.otp);

        if (!email || !token || !otp) {
            return renderForgotView(res, {
                error: "Email, reset identity and OTP are required.",
                email,
                token,
                step: "otp",
                openOtpModal: true
            });
        }

        const user = await User.findOne({ email, forgotPasswordToken: token });
        if (!user) {
            return renderForgotView(res, { error: "Invalid password reset request.", email });
        }

        const resendSeconds = user.forgotPasswordResendAt
            ? Math.max(0, Math.ceil((user.forgotPasswordResendAt.getTime() - Date.now()) / 1000))
            : 0;

        if (isExpired(user.forgotPasswordOtpExpires)) {
            return renderForgotView(res, {
                error: "OTP expired after 10 minutes. Please resend a new OTP.",
                email,
                token,
                step: "otp",
                openOtpModal: true,
                resendSeconds
            });
        }

        if (String(user.forgotPasswordOtp) !== String(otp)) {
            return renderForgotView(res, {
                error: "Invalid OTP.",
                email,
                token,
                step: "otp",
                openOtpModal: true,
                resendSeconds
            });
        }

        user.forgotPasswordVerified = true;
        user.forgotPasswordOtp = "";
        user.forgotPasswordOtpExpires = null;
        await user.save();

        return renderForgotView(res, {
            success: "OTP verified. Set your new password.",
            email,
            token,
            step: "reset"
        });
    } catch (error) {
        console.error("Verify forgot password OTP error", error.message);
        return renderForgotView(res, { error: "Unable to verify OTP. Please try again." });
    }
};

const resendForgotPasswordOtp = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const token = clean(req.body.token);
        const user = await User.findOne({ email, forgotPasswordToken: token });

        if (!user) {
            return renderForgotView(res, { error: "Invalid password reset request.", email });
        }

        if (user.forgotPasswordResendAt && Date.now() < user.forgotPasswordResendAt.getTime()) {
            const resendSeconds = Math.ceil((user.forgotPasswordResendAt.getTime() - Date.now()) / 1000);
            return renderForgotView(res, {
                error: `Please wait ${resendSeconds} seconds before resending OTP.`,
                email,
                token,
                step: "otp",
                openOtpModal: true,
                resendSeconds
            });
        }

        const otp = generateOtp();
        const now = Date.now();

        user.forgotPasswordOtp = String(otp);
        user.forgotPasswordOtpExpires = new Date(now + OTP_EXPIRY_MS);
        user.forgotPasswordResendAt = new Date(now + OTP_RESEND_MS);
        user.forgotPasswordVerified = false;
        await user.save();

        console.log(`OTP: ${otp}`);

        return renderForgotView(res, {
            success: "New OTP generated. Check the server console.",
            email,
            token,
            step: "otp",
            openOtpModal: true,
            resendSeconds: 30
        });
    } catch (error) {
        console.error("Resend OTP error", error.message);
        return renderForgotView(res, { error: "Unable to resend OTP. Please try again." });
    }
};

const resetForgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const token = clean(req.body.token);
        const newPassword = clean(req.body.newPassword);
        const confirmPassword = clean(req.body.confirmPassword);

        const user = await User.findOne({
            email,
            forgotPasswordToken: token,
            forgotPasswordVerified: true
        });

        if (!user) {
            return renderForgotView(res, { error: "Verify OTP before changing password.", email });
        }

        if (!newPassword || !confirmPassword) {
            return renderForgotView(res, { error: "Both password fields are required.", email, token, step: "reset" });
        }

        if (!passwordRegex.test(newPassword)) {
            return renderForgotView(res, { error: passwordConditionMessage, email, token, step: "reset" });
        }

        if (newPassword !== confirmPassword) {
            return renderForgotView(res, { error: "New password and confirm password do not match.", email, token, step: "reset" });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.forgotPasswordOtp = "";
        user.forgotPasswordToken = "";
        user.forgotPasswordOtpExpires = null;
        user.forgotPasswordResendAt = null;
        user.forgotPasswordVerified = false;
        await user.save();

        return res.redirect("/login?passwordChanged=1");
    } catch (error) {
        console.error("Reset forgot password error", error.message);
        return renderForgotView(res, { error: "Unable to reset password. Please try again." });
    }
};

const signUp = async (req, res) => {
    try {
        let { name, email, password } = req.body;
        name = name ? name.trim() : "";
        email = email ? email.toLowerCase().trim() : "";
        password = password ? password.trim() : "";

        if (!name || !email || !password) return res.render("adminSignup", { error: "All fields are required" });
        if (!passwordRegex.test(password)) return res.render("adminSignup", { error: passwordConditionMessage });

        const existUser = await User.findOne({ email });
        if (existUser) return res.render("adminSignup", { error: "Email already registered" });

        const hashPassword = await bcrypt.hash(password, 12);
        await User.create({ name, email, password: hashPassword });
        return res.redirect("/login");
    } catch (error) {
        console.error("DeskApp signup error", error);
        return res.render("adminSignup", { error: "Signup failed" });
    }
};

const signIn = (req, res, next) => {
    const password = req.body.password ? req.body.password.trim() : "";
    if (!passwordRegex.test(password)) return res.render("adminSignin", { error: passwordConditionMessage, success: null });

    passport.authenticate("local", (err, user, info) => {
        if (err) return res.render("adminSignin", { error: "Login failed", success: null });
        if (!user) return res.render("adminSignin", { error: info?.message || "Invalid email or password", success: null });
        req.logIn(user, (loginErr) => loginErr ? res.render("adminSignin", { error: "Login failed", success: null }) : res.redirect("/dashboard"));
    })(req, res, next);
};

const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((sessionErr) => {
            if (sessionErr) return next(sessionErr);
            res.clearCookie("connect.sid");
            return res.redirect("/login");
        });
    });
};

module.exports = {
    loginPage,
    registerPage,
    forgotPasswordPage,
    requestForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resendForgotPasswordOtp,
    resetForgotPassword,
    signUp,
    signIn,
    logout
};
