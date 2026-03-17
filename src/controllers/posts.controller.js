import mongoose from "mongoose";
import PostMessage from "../models/PostMessage.model.js";
import cloudinary from "../utils/cloudinary.js"; 

// الحصول على جميع المنشورات مع الترقيم (Pagination)
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

// الحصول على منشور واحد بواسطة الـ ID
export const getPost = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await PostMessage.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json(post);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// إنشاء منشور جديد
// ملاحظة: selectedFile يأتي هنا كـ URL جاهز من الفرونت إند
export const createPost = async (req, res) => {
    const post = req.body;
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

// تحديث منشور موجود
export const updatePost = async (req, res) => {
    const { id: _id } = req.params;
    const post = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No Post with that id');

    try {
        // نقوم بالتحديث مباشرة لأن selectedFile يأتي كـ URL
        const updatedPost = await PostMessage.findByIdAndUpdate(_id, { ...post, _id }, { new: true });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// حذف منشور وحذف صورته من Cloudinary
export const deletePost = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No Post with that id');

    try {
        const post = await PostMessage.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // حذف الصورة من Cloudinary إذا كانت موجودة
        if (post.selectedFile && post.selectedFile.includes('cloudinary')) {
            const publicId = post.selectedFile.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await PostMessage.findByIdAndDelete(id);
        res.json({ message: 'Post and associated image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// الإعجاب بمنشور
export const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No Post with that id');
        
        const post = await PostMessage.findById(id);
        const index = post.likes.findIndex((id) => id === String(req.userId));

        if (index === -1) {
            post.likes.push(req.userId);
        } else {
            post.likes = post.likes.filter((id) => id !== String(req.userId));
        }

        const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { new: true });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// إضافة تعليق
export const commentPost = async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;
    try {
        const post = await PostMessage.findById(id);
        post.comments.push(value);
        const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { new: true });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// البحث عن المنشورات
export const getPostsBySearch = async (req, res) => {
    const { searchQuery, tags, page } = req.query;
    try {
        const title = new RegExp(searchQuery, 'i');
        const LIMIT = 8;
        const startIndex = (Number(page) - 1) * LIMIT;
        const query = { $or: [{ title }, { tags: { $in: tags.split(',') } }] };
        
        const total = await PostMessage.countDocuments(query);
        const posts = await PostMessage.find(query).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

        res.json({ data: posts, currentPage: Number(page), numberOfPages: Math.ceil(total / LIMIT) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};