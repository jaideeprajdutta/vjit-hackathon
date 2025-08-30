# Grievance System Backend API

A RESTful API for the Grievance Redressal System with file upload support.

## Features

- 📝 Grievance management (CRUD operations)
- 📎 File upload and management
- 📊 Statistics and reporting
- 🔍 Filtering and pagination
- 🛡️ Error handling and validation
- 📁 Organized modular structure

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # In-memory database (replace with real DB)
│   │   └── multer.js        # File upload configuration
│   ├── controllers/
│   │   ├── fileController.js      # File operations
│   │   └── grievanceController.js # Grievance operations
│   ├── middleware/
│   │   ├── cors.js          # CORS configuration
│   │   └── errorHandler.js  # Error handling
│   └── routes/
│       ├── fileRoutes.js    # File-related routes
│       ├── grievanceRoutes.js # Grievance-related routes
│       └── index.js         # Route aggregation
├── uploads/                 # File storage directory
├── server.js               # Main server file
├── package.json
└── README.md
```

## Installation

1. Navigate to the backend directory:
   ```bash
   cd grievance-system/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Grievances
- `POST /api/grievances` - Create a new grievance
- `GET /api/grievances` - Get all grievances (with filtering)
- `GET /api/grievances/statistics` - Get grievance statistics
- `GET /api/grievances/:id` - Get specific grievance
- `PATCH /api/grievances/:id/status` - Update grievance status

### Files
- `POST /api/files/upload` - Upload files for a grievance
- `GET /api/files/:grievanceId` - Get files for a grievance
- `GET /api/files/download/:fileId` - Download a file
- `GET /api/files/preview/:fileId` - Preview an image file
- `DELETE /api/files/:fileId` - Delete a file

## Usage Examples

### Create a Grievance
```bash
curl -X POST http://localhost:5000/api/grievances \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hostel Food Quality Issue",
    "description": "The food quality in the hostel mess has deteriorated significantly.",
    "category": "hostel",
    "priority": "high",
    "submitterName": "John Doe",
    "submitterEmail": "john@example.com",
    "submitterRole": "student",
    "institution": "ABC University"
  }'
```

### Upload Files
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -F "files=@document.pdf" \
  -F "files=@image.jpg" \
  -F "grievanceId=your-grievance-id" \
  -F "description=Supporting documents"
```

### Get Grievances with Filters
```bash
curl "http://localhost:5000/api/grievances?status=submitted&category=academic&page=1&limit=10"
```

## Environment Variables

See `.env.example` for all available configuration options.

## Adding New Features

The modular structure makes it easy to add new features:

1. **New Routes**: Add to `src/routes/`
2. **New Controllers**: Add to `src/controllers/`
3. **New Middleware**: Add to `src/middleware/`
4. **Database Changes**: Modify `src/config/database.js`

## Future Enhancements

- [ ] Replace in-memory database with PostgreSQL/MongoDB
- [ ] Add JWT authentication
- [ ] Add email notifications
- [ ] Add real-time updates with WebSockets
- [ ] Add API rate limiting
- [ ] Add comprehensive logging
- [ ] Add unit and integration tests