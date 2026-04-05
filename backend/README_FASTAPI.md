# FastAPI Backend Migration Notes

## Folder Roles
- `app/main.py`: FastAPI app entrypoint, middleware, health routes, router registration.
- `app/config/`: Infrastructure setup (`db.py` for MongoDB lifecycle and client).
- `app/models/`: Domain enums and collection name constants.
- `app/schemas/`: Pydantic request/response contracts.
- `app/routes/`: API route definitions using `APIRouter`.
- `app/controllers/`: Endpoint business logic (converted from Express controllers).
- `app/services/`: Reusable technical services (email, cloudinary, auth helpers, notifications).
- `app/utils/`: Shared helpers for ObjectId conversion, serialization, timestamps, pagination.
- `app/core/`: App-wide settings, auth dependencies, security helpers, exception handlers.

## Run Locally
1. `cd backend`
2. `python -m venv .venv`
3. Windows: `.venv\\Scripts\\activate`
4. `pip install -r requirements.txt`
5. Update `.env` values.
6. `uvicorn app.main:app --reload --host 0.0.0.0 --port 5000`

## Notes
- JWT auth is implemented with cookie + bearer token support.
- CORS middleware is enabled.
- All route groups from the Node backend are converted to FastAPI routers.