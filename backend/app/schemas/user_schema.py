from pydantic import BaseModel

class RegisterSchema(BaseModel):
    name: str
    email: str
    password: str

class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        orm_mode = True

class User(UserSchema):
    id: int

    class Config:
        orm_mode = True
