import mongoose from "mongoose";
import PostMessage from "../models/PostMessage.model.js"

export const getPosts= async (req, res)=>{
    const {page} = req.query;
    try {
        const LIMIT=8;
        const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
        const total = await PostMessage.countDocuments({});
        const posts = await PostMessage.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
        res.status(200).json({
            data: posts,
            currentPage: Number(page),
            numberOfPages: Math.ceil(total/LIMIT)
        });    
    } catch (error) {
        res.status(404).json({message: error.message});
    } 
    
}

export const getPost = async(req, res)=>
{
    const {id} = req.params;
    try 
    {
        const post = await PostMessage.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    } catch (error) 
    {
        res.status(404).json({message:error.message});
    }
}

export const createPost = async (req, res)=>
{
    const post = req.body;
    const newPost = new PostMessage({...post, creator: req.userId, createdAt: -1, createdAt: new Date().toISOString()} );

    try 
    {
        const savedPost = await newPost.save();    
        res.status(201).json(savedPost);
    } catch (error) 
    {
        res.status(409).json({message: error.message});
    }
}

export const updatePost = async (req, res)=>
{
    const {id:_id} = req.params;//Rename The id to _id
    const post = req.body;//Recieve The Data frontend From here

    // To Check The mongoose id with actual id is valid
    if(!mongoose.Types.ObjectId.isValid(_id)) 
        return res.status(404).send('No Post with that id')
    const updatedPost = await PostMessage.findByIdAndUpdate(_id, {...post, _id}, { returnDocument: 'after' });

    res.json(updatedPost); 
}

export const deletePost = async(req, res)=>{
    const {id} = req.params;

    // To Check The mongoose id with actual id is valid
    if(!mongoose.Types.ObjectId.isValid(id)) 
        return res.status(404).send('No Post with that id')
    await PostMessage.findByIdAndDelete(id);
    
    res.json({message: 'Post Deleted Successfully'});
}

export const likePost = async(req, res)=>
{
    try 
    {
        const {id} = req.params;

        if(!req.userId)
            return  res.status(401).json({message:"Unauthenticated"});
        
        if(!mongoose.Types.ObjectId.isValid(id)) 
            return res.status(404).send('No Post with that id')
        
        const post = await PostMessage.findById(id);

        //if the users id is already in the like section or not
        const index = post.likes.findIndex((id)=> id === String(req.userId));
        
        // if the id is not in the index he likes the post
        if(index === -1) 
        {
            // like the post
            post.likes.push(req.userId);
        }
        else
        {
            // dislike the post{remove he's like from array}
            post.likes = post.likes.filter((id) => id !== String(req.userId));
        } 
        const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { returnDocument: 'after' });
        res.json(updatedPost);   
    } catch (error) {
        console.log("Error in likePost:", error);
        res.status(500).json({ message: error.message });
    }
}

export const commentPost = async(req, res)=>
{
    const {id} = req.params;
    const {value} = req.body;
    // ADD THIS LOG to see exactly what the backend is getting
    console.log("ID received:", id);
    try 
    {
        const post = await PostMessage.findById(id);

        post.comments.push(value);

        const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { returnDocument: 'after' });

        res.json(updatedPost);
          
    } catch (error) {
        console.log("Error in Comment Post:", error);
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