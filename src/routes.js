const { Router } = require('express');
const VRController = require('./controllers/VRController');
const SubmissionController = require('./controllers/SubmissionController');
const multer = require('multer');
const upload = multer({ dest: 'images/' });

const routes = Router();

routes.post('/api/credentials', async (req, res) => {
  return await VRController.changeCredentials(req, res);
});

routes.post('/api/analyze', upload.single('image'), async (req, res) => {
  return await VRController.analyze(req, res);
});

routes.post('/api/submit', async (req, res) => {
  return await SubmissionController.submit(req, res);
});

module.exports = routes;
