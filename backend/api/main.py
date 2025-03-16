from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import images

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Image API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)