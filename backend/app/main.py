from fastapi import FastAPI
from .routers import health, users, auth, exams
from app.core.database import init_db

app = FastAPI(title="Hirere API")
app.include_router(health.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(exams.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    init_db()
