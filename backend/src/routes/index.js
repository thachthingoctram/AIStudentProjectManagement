const express = require("express");

const authRoutes = require("./authRoutes");
const testRoutes = require("./testRoutes");
const userRoutes = require("./userRoutes");
const studentRoutes = require("./studentRoutes");
const teacherRoutes = require("./teacherRoutes");
const classRoutes = require("./classRoutes");
const groupRoutes = require("./groupRoutes");
const groupMemberRoutes = require("./groupMemberRoutes");
const topicRoutes = require("./topicRoutes");
const projectRoutes = require("./projectRoutes");
const submissionRequirementRoutes = require("./submissionRequirementRoutes");
const submissionRoutes = require("./submissionRoutes");
const progressRoutes = require("./progressRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/test", testRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/classes", classRoutes);
router.use("/groups", groupRoutes);
router.use("/group-members", groupMemberRoutes);
router.use("/topics", topicRoutes);
router.use("/projects", projectRoutes);
router.use("/submission-requirements", submissionRequirementRoutes);
router.use("/submissions", submissionRoutes);
router.use("/progress", progressRoutes);

module.exports = router;
