import mongoose from "mongoose";
import PostMessage from "../models/PostMessage.model.js";
import cloudinary from "../utils/cloudinary.js"; // استيراد الإعدادات

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

export const createPost = async (req, res) => {
    const post = req.body;
    try {
        // رفع الصورة إلى Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(post.selectedFile, {
            upload_preset: "memories_preset", // اختياري: يمكنك إنشاء preset في cloudinary
        });

        const newPost = new PostMessage({ 
            ...post, 
            selectedFile: uploadResponse.secure_url, // تخزين الرابط بدلاً من Base64
            creator: req.userId, 
            createdAt: new Date().toISOString() 
        });

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
        const oldPost = await PostMessage.findById(_id);
        if (!oldPost) return res.status(404).json({ message: "Post not found" });

        let updatedData = { ...post };

        // التحقق: هل أرسل المستخدم صورة جديدة (Base64)؟
        if (post.selectedFile && post.selectedFile.startsWith('data:image')) {
            
            // 1. حذف الصورة القديمة من Cloudinary لتوفير المساحة
            if (oldPost.selectedFile) {
                const oldPublicId = oldPost.selectedFile.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(oldPublicId);
            }

            // 2. رفع الصورة الجديدة
            const uploadResponse = await cloudinary.uploader.upload(post.selectedFile);
            updatedData.selectedFile = uploadResponse.secure_url;
        }

        const updatedPost = await PostMessage.findByIdAndUpdate(_id, updatedData, { new: true });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deletePost = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No Post with that id');

    try {
        // 1. ابحث عن المنشور للحصول على رابط الصورة
        const post = await PostMessage.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // 2. استخراج الـ Public ID من رابط Cloudinary
        // الرابط يكون عادة: https://res.cloudinary.com/cloud_name/image/upload/v1234567/public_id.jpg
        if (post.selectedFile) {
            const publicId = post.selectedFile.split('/').pop().split('.')[0];
            
            // 3. حذف الصورة من Cloudinary
            await cloudinary.uploader.destroy(publicId);
        }

        // 4. حذف المنشور من قاعدة البيانات
        await PostMessage.findByIdAndDelete(id);

        res.json({ message: 'Post and associated image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

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