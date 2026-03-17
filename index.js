import express from 'express';
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import postRoutes from "./src/routes/posts.route.js";
import userRoutes from "./src/routes/users.route.js";
import dotenv from "dotenv";

const app = express();
dotenv.config();

// 1. إعدادات الـ Body Parser (يجب أن تكون في البداية وبالحد المطلوب)
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// 2. إعدادات الحماية والضغط
app.use(helmet()); 
app.use(compression()); 

// 3. إعدادات الـ CORS
app.use(cors({
    origin: ["https://memories-gallary.netlify.app", "http://localhost:3000"], 
    credentials: true
}));

// --- ملاحظة: قمت بحذف app.use(express.json()) من هنا لأن bodyParser يقوم بالمهمة بحد الـ 50MB ---

// 4. الـ Routes
app.use('/posts', postRoutes);
app.use('/users', userRoutes);

app.get("/", (req, res) => res.send("Hello From Memory Project api"));

// 5. معالجة الأخطاء العامة
app.use((err, req, res, next) => {
    // إذا كان الخطأ بسبب حجم الملف، سنعطي رسالة واضحة
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: "Image is too large! Please try a smaller one." });
    }
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

// 6. الاتصال بقاعدة البيانات وتشغيل السيرفر
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Server Running On Port: ${PORT}`)))
    .catch((error) => console.log(error.message));