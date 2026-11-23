const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const middleware = require("../middlewares/authMiddleware");

// Public routes for fetching blog content
router.get("/", blogController.getPosts);
router.get("/categories", blogController.getCategories);
router.get("/tags", blogController.getTags);
router.get("/:identifier", blogController.getPostByIdOrSlug);

// Protected administrative routes for managing blog posts
router.post("/", middleware.authMiddleware(["admin"]), blogController.createPost);
router.put("/:id", middleware.authMiddleware(["admin"]), blogController.updatePost);
router.delete("/:id", middleware.authMiddleware(["admin"]), blogController.deletePost);

module.exports = router;
