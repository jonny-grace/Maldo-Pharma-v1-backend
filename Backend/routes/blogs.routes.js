const router = require('express').Router();
const Blog = require('../models/blog.model');
const multer = require('multer');

let imageUrl = "";

const Storage = multer.diskStorage({
  destination: "public/blogs",
  filename: (req, file, cb) => {
    imageUrl = Date.now() + file.originalname;
    cb(null, imageUrl);
  },
});

const upload = multer({
  storage: Storage,
}).single("image");

module.exports.index = async (req, res) => {
  const blogs = await Blog.find({});
  res.status(200).send(blogs);
};

router.post('/', async (req, res) => {
    upload(req, res, (err) => {
        if (err) {
          console.log(err);
        } else {
          const newBlog = new Blog({
            title:req.body.title,
            description:req.body.description,
            imageUrl: "blogs/" + imageUrl,
          });
          newBlog
            .save()
            .then(() => {
              res.status(201).send(newBlog);
            })
            .catch((err) => {
              res.send({ error: err.message });
              // console.log(err.message);
            });
        }
      });
});

// Get all Blogs
router.get('/', async (req, res) => {
try {
const blogs = await Blog.find();
console.log('whaaaaaaaaaaaaaaaaaaat',blogs)
res.json(blogs);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// Get single Blog
router.get('/:id', async (req, res) => {
try {
const blog = await Blog.findById(req.params.id);
res.json(blog);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// Update a Blog
router.patch('/:id', async (req, res) => {
try {
const updatedBlog = await Blog.updateOne(
{ _id: req.params.id },
{ $set: req.body }
);
res.json(updatedBlog);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// Delete a Blog
router.delete('/:id', async (req, res) => {
try {
const removedBlog = await Blog.deleteOne({ _id: req.params.id });
res.json({ message: 'Blog removed successfully' });
} catch (err) {
res.status(500).json({ message: err.message });
}
});

module.exports = router;