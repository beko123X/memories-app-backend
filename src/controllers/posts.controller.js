import mongoose from "mongoose";
import PostMessage from "../models/PostMessage.model.js";
import cloudinary from "../utils/cloudinary.js";

export const getPosts = async (req, res) => {
    const { page } = req.query;
    try {
        const LIMIT = 8;
        const startIndex = (Number(page) - 1) * LIMIT;
        const total = await PostMessage.countDocuments({});
        const posts = await PostMessage.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
        res.status(200).json({
            data: posts,
            currentPage: Number(page),
            numberOfPages: Math.ceil(total / LIMIT)
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const createPost = async (req, res) => {
    const post = req.body;
    // selectedFile is now already a Cloudinary URL from the frontend
    const newPost = new PostMessage({ 
        ...post, 
        creator: req.userId, 
        createdAt: new Date().toISOString() 
    });

    try {
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updatePost = async (req, res) => {
    const { id: _id } = req.params;
    const post = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No Post with that id');

    try {
        // Just update the record. Logic for old image deletion can be added here if needed,
        // but simple URL update works instantly.
        const updatedPost = await PostMessage.findByIdAndUpdate(_id, { ...post, _id }, { new: true });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deletePost = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No Post with that id');

    try {
        const post = await PostMessage.findById(id);
        if (post?.selectedFile) {
            const publicId = post.selectedFile.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        await PostMessage.findByIdAndDelete(id);
        res.json({ message: 'Post Deleted Successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ... rest of your controllers (likePost, commentPost, etc.) stay the same