import express from "express";
import { createPost, deletePost, getPost, getPosts, getPostsBySearch, likePost, commentPost ,updatePost } from "../controllers/posts.controller.js";
import auth from "../middleware/Auth.middleware.js";
import { postValidator } from "../middleware/validatior.js";

const router = express.Router();

router.get("/", getPosts);
// search for posts
router.get("/search",getPostsBySearch);

router.get("/:id", getPost)
router.post("/", auth,postValidator,createPost);

router.patch("/:id", auth,postValidator,updatePost);

router.patch("/:id/likePost", auth,likePost);

router.delete("/:id", auth ,deletePost);

router.post("/:id/commentPost", auth ,commentPost);


export default router;