# Image Tagger

## Overview
Image Tagger is a full-stack application designed for efficient image management, tagging, and organization. It consists of a FastAPI backend, PostgreSQL database, and a modern React frontend that provides an intuitive interface for interacting with your image collection.

## Features
- **Image Management**
  - Bulk upload images through drag-and-drop or file selection
  - Support for folder uploads
  - Progress tracking for uploads
  - Image preview generation
  
- **Tagging System**
  - Add and manage tags for images
  - Batch tagging interface
  - Author attribution
  - Automatic tag suggestions (coming soon)

- **Search & Discovery**
  - Full-text search across image metadata
  - Filter by tags, authors, and file types
  - Visual search results with previews
  - Advanced filtering options

- **Modern Web Interface**
  - Responsive design that works on desktop and mobile
  - Dark/light theme support
  - Intuitive drag-and-drop interactions
  - Real-time updates and notifications

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- shadcn/ui component system
- React Query for state management
- React Router for navigation

### Backend
- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- JWT authentication
- Image processing capabilities

### Infrastructure
- Docker containerization
- Docker Compose for local development
- Database migrations with Alembic

## Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+
- Docker & Docker Compose
- PostgreSQL 13+

### Installation

### Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details.

### Acknowledgments
shadcn/ui for the component system
Lucide icons for the icon set
The FastAPI team for the amazing framework

1. Clone the repository
```sh
git clone <repository-url>
cd image-tagger
```

2. Start the backend services
```sh
cd backend
docker-compose up -d
```

3. Install and start the frontend
```sh
cd frontend
npm install
npm run dev
```

4. Access the application
```sh
Frontend: http://localhost:8080
API: http://localhost:8000
API Docs: http://localhost:8000/docs
```