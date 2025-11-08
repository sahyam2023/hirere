from fastapi import FastAPI
from .routers import health, users, auth, exams, proctor, submissions, questions
from app.core.database import init_db, engine
from sqlalchemy import inspect, text
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Hirere API")
app.include_router(health.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(proctor.router, prefix="/api/proctor", tags=["proctor"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["submissions"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])

def check_and_add_role_column():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    if 'role' not in columns:
        with engine.connect() as connection:
            connection.execute(text('ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT \'user\''))
            connection.commit()

@app.on_event("startup")
def startup_event():
    init_db()
    check_and_add_role_column()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
