import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.FILE_UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) }
});

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use(cors());
app.use(express.json());

// Create assistant
app.post('/assistants', [
  body('name').isString().notEmpty(),
  body('model').isString().notEmpty(),
  body('instructions').isString().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assistant = await openai.beta.assistants.create(req.body);
    res.status(201).json(assistant);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get assistant
app.get('/assistants/:id', async (req, res) => {
  try {
    const assistant = await openai.beta.assistants.retrieve(req.params.id);
    res.json(assistant);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update assistant
app.put('/assistants/:id', [
  body('name').optional().isString(),
  body('model').optional().isString(),
  body('instructions').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assistant = await openai.beta.assistants.update(
      req.params.id,
      req.body
    );
    res.json(assistant);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Delete assistant
app.delete('/assistants/:id', async (req, res) => {
  try {
    const response = await openai.beta.assistants.del(req.params.id);
    res.json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Create thread
app.post('/threads', async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res.status(201).json(thread);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Send message to thread
app.post('/threads/:id/messages', [
  body('content').isString().notEmpty(),
  body('role').isIn(['user', 'assistant'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const message = await openai.beta.threads.messages.create(
      req.params.id,
      req.body
    );
    res.status(201).json(message);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Attach file to thread
app.post('/threads/:id/files', upload.single('file'), async (req, res) => {
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: 'assistants'
    });

    const message = await openai.beta.threads.messages.create(req.params.id, {
      role: 'user',
      content: 'Please analyze the attached file',
      file_ids: [file.id]
    });

    res.status(201).json({ file, message });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get thread messages
app.get('/threads/:id/messages', async (req, res) => {
  try {
    const messages = await openai.beta.threads.messages.list(req.params.id);
    res.json(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync(process.env.FILE_UPLOAD_PATH)) {
  fs.mkdirSync(process.env.FILE_UPLOAD_PATH);
}

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
