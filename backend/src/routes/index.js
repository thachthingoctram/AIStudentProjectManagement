const express = require("express");

const authRoutes = require("./authRoutes");
const testRoutes = require("./testRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/test", testRoutes);
router.use("/users", userRoutes);

module.exports = router;
