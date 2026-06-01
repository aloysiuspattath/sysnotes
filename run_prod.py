from app import app
from waitress import serve
import sys
import logging

if __name__ == "__main__":
    port = 5005
    
    # Configure simple logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger = logging.getLogger('waitress')
    logger.setLevel(logging.INFO)
    
    print(f"===================================================")
    print(f"  Starting SysNotes Production Server on port {port}")
    print(f"  Access the app at: http://localhost:{port}")
    print(f"===================================================")
    
    try:
        serve(app, host='0.0.0.0', port=port, threads=4)
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)
