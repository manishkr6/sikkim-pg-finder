from app.main import app

for route in app.routes:
    print(f"Path: {route.path:30} Methods: {getattr(route, 'methods', 'All')}")
