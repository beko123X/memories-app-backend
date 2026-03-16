import  express  from 'express';
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

app.use(bodyParser.json({limit: "50mb", extended:true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended:true}));
app.use(cors({
    origin: ["https://memories-gallary.netlify.app", "http://localhost:3000"], // أضف رابط Netlify هنا
    credentials: true
}));
app.use(helmet()); // يحمي السيرفر من هجمات الـ Headers الشائعة
app.use(compression()); // يقلل حجم البيانات المرسلة للمتصفح لتسريع التحميل

const PORT = process.env.PORT || 3000;

app.use(express.json());


///psots endpoints using: /api/posts 
app.use('/posts', postRoutes);
app.use('/users', userRoutes);

app.get("/",(req, res)=>res.send("Hello From Memory Project api"));

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});
//Connecting To The MongoDB && Listening To The Server
mongoose.connect(process.env.MONGO_URI)//if the connecting to the database is connecting successfully is wright will listen to the server
    .then(()=> app.listen(PORT, ()=> console.log(`Server Running On Port: http://localhost:${PORT}`)
    ))//if the connecting to the database if fail the errors will catch the errors
    .catch((error)=> console.log(error.message));

