# OpenAI Assistant API

## API Endpoints

### Assistants
- `POST /assistants` - Create new assistant
- `GET /assistants/:id` - Get assistant details
- `PUT /assistants/:id` - Update assistant
- `DELETE /assistants/:id` - Delete assistant

### Threads
- `POST /threads` - Create new thread
- `POST /threads/:id/messages` - Send message to thread
- `POST /threads/:id/files` - Attach file to thread
- `GET /threads/:id/messages` - Get thread messages

## Environment Variables
- `OPENAI_API_KEY` - Your OpenAI API key
- `PORT` - Server port (default: 3000)
- `FILE_UPLOAD_PATH` - Path for file uploads
- `MAX_FILE_SIZE` - Maximum file size in bytes

## Installation
1. Clone repository
2. Run `npm install`
3. Create `.env` file
4. Run `npm start`
