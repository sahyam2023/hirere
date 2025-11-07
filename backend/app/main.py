from fastapi import FastAPI
from .routers import health, users
from app.core.database import init_db
from .routers import health, users, auth


app = FastAPI(title="Hirere API")
app.include_router(health.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    init_db()
