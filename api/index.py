import sys
import os

# Add root directory to python path for module imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Export app for Vercel Serverless Function runtime
__all__ = ["app"]
