from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import images, users

app = FastAPI()

# Middleware to allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(images.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the BnB Image Tagging API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)