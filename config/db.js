const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/admin-daxu");
        console.log("Database Connected Successfully !");
    } catch (error) {
        console.log("Database not Connected Successfully !");
        console.log(error.message);
    }
};

module.exports = connectDB;
