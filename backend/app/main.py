from fastapi import FastAPI
from .routers import health, users, auth, exams, proctor, submissions, questions
from app.core.database import init_db, engine
from app.models.assignment import ExamAssignment
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

origins = [
    "http://localhost:5173",
]
def check_and_add_role_column():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    if 'role' not in columns:
        with engine.connect() as connection:
            connection.execute(text('ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT \'user\''))
            connection.commit()

def check_and_add_message_column_to_proctor_logs():
    inspector = inspect(engine)
    if 'proctor_logs' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('proctor_logs')]
        if 'message' not in columns:
            with engine.connect() as connection:
                connection.execute(text('ALTER TABLE proctor_logs ADD COLUMN message TEXT'))
                connection.commit()

def check_and_add_session_id_to_proctor_logs():
    inspector = inspect(engine)
    if 'proctor_logs' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('proctor_logs')]
        if 'session_id' not in columns:
            with engine.connect() as connection:
                connection.execute(text('ALTER TABLE proctor_logs ADD COLUMN session_id VARCHAR NOT NULL'))
                connection.commit()

@app.on_event("startup")
def startup_event():
    init_db()
    check_and_add_role_column()
    check_and_add_message_column_to_proctor_logs()
    check_and_add_session_id_to_proctor_logs()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # <--- CHANGE THIS
    allow_credentials=True, # Important for sending cookies/auth headers
    allow_methods=["*"],    # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],    # Allows all headers
)
