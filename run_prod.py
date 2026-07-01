from app import app
from waitress import serve
import sys
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    host = os.getenv('HOST', '0.0.0.0')
    try:
        port = int(os.getenv('PORT', '5005'))
    except ValueError:
        port = 5005
    
    # Configure simple logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger = logging.getLogger('waitress')
    logger.setLevel(logging.INFO)
    
    print(f"===================================================")
    print(f"  Starting SysNotes Production Server")
    print(f"  Listening on: http://{host}:{port}")
    print(f"===================================================")
    
    try:
        serve(app, host=host, port=port, threads=4)
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)
