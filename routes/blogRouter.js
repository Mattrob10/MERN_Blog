const express = require("express");
const blogRouter = express.Router();
const Blog = require("../models/blog.js");
const {expressjwt} = require('express-jwt')
const User = require("../models/user.js")


// Get All Blogs
blogRouter.get("/", (req, res, next) => {
  Blog.find((err, blogs) => {
    if (err) {
      res.status(500);
      return next(err);
    }
    
    return res.status(200).send(blogs);
  }).populate("user");
});

// Get Blog by user id
blogRouter.get("/user",expressjwt({ secret: process.env.SECRET, algorithms: ['HS256'] }),(req, res, next) => {
  Blog.find({ user: req.auth._id }, (err, todos) => {
    if(err){
      res.status(500)
      return next(err)
    }
    return res.status(200).send(todos)
  })
})

// Add new Blog
blogRouter.post("/", expressjwt({ secret: process.env.SECRET, algorithms: ['HS256'] }),(req, res, next) => {
  req.body.user = req.auth._id 
  const newBlog = new Blog(req.body);
  newBlog.save((err, savedBlog) => {
    if (err) {
      res.status(500);
      return next(err);
    }
    return res.status(201).send(savedBlog);
  });
});

// Delete BLOG
blogRouter.delete("/:blogId", expressjwt({ secret: process.env.SECRET, algorithms: ['HS256'] }),(req, res, next) => {
  Blog.findOneAndDelete({ _id: req.params.blogId, user: req.auth._id  }, (err, deletedBlog) => {
    if (err) {
      res.status(500);
      return next(err);
    }
    return res
      .status(200)
      .send(`Successfully delete blog: ${deletedBlog.title}`);
  });
});

// Update Blog
blogRouter.put("/:blogId", expressjwt({ secret: process.env.SECRET, algorithms: ['HS256'] }),(req, res, next) => {
  Blog.findOneAndUpdate(
    { _id: req.params.blogId, user: req.auth._id  },
    req.body,
    { new: true },
    (err, updatedBlog) => {
      if (err) {
        res.status(500);
        return next(err);
      }
      return res.status(201).send(updatedBlog);
    }
  );
});


//LIKE 
// LIKE
blogRouter.put('/like/:blogId', expressjwt({ secret: process.env.SECRET, algorithms: ['HS256'] }), async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    if (blog.likes.filter(like => like.user.toString() === req.auth._id).length > 0) {
      return res.status(400).json({ msg: 'Blog already liked' });
    }
    blog.likes.unshift({ user: req.auth._id });
    await blog.save();
    res.json(blog.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


blogRouter.put('/unlike/:blogId', expressjwt({ secret: process.env.SECRET, algorithms: ['HS256'] }), async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    if (blog.likes.filter(like => like.user.toString() === req.auth._id).length === 0) { 
      return res.status(400).json({ msg: 'Blog has not yet been liked' });
    }
    const removeIndex = blog.likes.map(like => like.user.toString()).indexOf(req.auth._id)

    blog.likes.splice(removeIndex, 1)

    await blog.save();
    res.json(blog.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = blogRouter;
