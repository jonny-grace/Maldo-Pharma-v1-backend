

// // Create a Service
// router.post('/', async (req, res) => {
// try {
// const service = new Service(req.body);
// const savedService = await service.save();
// res.json(savedService);
// } catch (err) {
// res.status(400).json({ message: err.message });
// }
// });
const router = require('express').Router();
const Service = require('../models/service.model');
const multer = require('multer');

let imageUrl = "";

const Storage = multer.diskStorage({
  destination: "public/services",
  filename: (req, file, cb) => {
    imageUrl = Date.now() + file.originalname;
    cb(null, imageUrl);
  },
});

const upload = multer({
  storage: Storage,
}).single("image");

module.exports.index = async (req, res) => {
  const Services = await Service.find({});
  res.status(200).send(Services);
};

router.post('/', async (req, res) => {
    upload(req, res, (err) => {
        if (err) {
          console.log(err);
        } else {
          const newService = new Service({
            title:req.body.title,
            description:req.body.description,
            imageUrl: "services/" + imageUrl,
          });
          newService
            .save()
            .then(() => {
              res.status(201).send(newService);
            })
            .catch((err) => {
              res.send({ error: err.message });
              // console.log(err.message);
            });
        }
      });
});
// Get all Services
router.get('/', async (req, res) => {
try {
const services = await Service.find();
res.json(services);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// Get single Service
router.get('/:id', async (req, res) => {
try {
const service = await Service.findById(req.params.id);
res.json(service);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// Update a Service
router.patch('/:id', async (req, res) => {
try {
const updatedService = await Service.updateOne(
{ _id: req.params.id },
{ $set: req.body }
);
res.json(updatedService);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// Delete a Service
router.delete('/:id', async (req, res) => {
    try {
      const removedService = await Service.deleteOne({ _id: req.params.id });
      res.json({ message: 'Service removed successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;