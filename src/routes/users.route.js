import express from "express";
import { signIn, signUp } from "../controllers/users.controller.js";
import { signUpValidator } from "../middleware/validatior.js";

const router = express.Router();

router.post("/signin", signIn);
router.post("/signup", signUpValidator,signUp);


export default router;