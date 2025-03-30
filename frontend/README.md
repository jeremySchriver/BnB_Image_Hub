# B&B Image Hub

## Overview
B&B Image Hub is a full-stack image management system designed for efficient tagging, searching, and organizing of images. It provides a modern web interface with intuitive controls for managing your image collection.

## Features
- **Image Management**
  - Drag-and-drop or file selection upload interface
  - Upload progress tracking
  - Image preview generation
  - Bulk operations support
  
- **Tagging System**
  - Add and manage image tags
  - Batch tagging interface
  - Author attribution and management
  - User permission levels

- **Search & Discovery**
  - Full-text search across image metadata
  - Filter by tags, authors, and file types
  - Visual search results with previews
  - Advanced filtering options

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS + shadcn/ui components
- React Query for state management
- React Router for navigation

### Backend
- FastAPI (Python)
- SQLite database
- SQLAlchemy ORM
- JWT authentication
- Alembic migrations

## Getting Started

### Prerequisites
- Node.js & npm
- Python 3.13+
- Git

### Development Setup

1. Clone the repository:
```sh
git clone <repository-url>
cd Image_Tagger
```

2. Backend setup:
```sh
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload
```

3. Frontend setup:
```sh
cd frontend
npm install
npm run dev
```

4. Access the application:
- Frontend: http://localhost:8080
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Building for Production

### Frontend
```sh
cd frontend
npm run build
```

### Backend
```sh
cd backend
python -m uvicorn api.main:app
```

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- [shadcn/ui](https://ui.shadcn.com/) for the component system
- [Lucide](https://lucide.dev/) for the icon set
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework