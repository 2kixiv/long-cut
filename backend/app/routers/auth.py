from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import GoogleLoginRequest, Token, UserCreate, UserLogin, UserResponse
from app.auth import hash_password, verify_google_token, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse)
def signup(req: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    hashed_password = hash_password(req.password)
    user = User(email=req.email, password_hash=hashed_password)

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email
    )


@router.post("/login")
def login(req: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is not correct")

    login_success = verify_password(req.password, user.password_hash)

    if not login_success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is not correct")

    access_token = create_access_token(user.id)

    return Token(access_token=access_token)

@router.post("/google")
def google_login(
    req: GoogleLoginRequest,
    db: Session = Depends(get_db)
) -> Token:
    payload = verify_google_token(req.credential)

    if not payload.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified"
        )

    google_sub = payload["sub"]
    email = payload["email"]

    user = db.query(User).filter(User.google_sub == google_sub).first()

    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_sub = google_sub
        else:
            user = User(
                email=email,
                google_sub=google_sub,
                password_hash=None
            )
            db.add(user)

        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id)
    return Token(access_token=access_token)