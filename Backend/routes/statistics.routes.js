const router = require('express').Router();
const Blog = require('../models/blog.model');
const Service = require('../models/service.model');

router.get('/', async (req, res) => {
    try {
        const blogCount = await Blog.countDocuments();
        const serviceCount = await Service.countDocuments();
       
        
        res.json({  blogCount, serviceCount});
    } catch (err) {
        console.error('Error retrieving blog count:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
