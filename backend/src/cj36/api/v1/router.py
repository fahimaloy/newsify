from fastapi import APIRouter

# This is the name main.py expects → must be called "api_router"
api_router = APIRouter()

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "project": "CJ36-API"}
