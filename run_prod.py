from app import app
from waitress import serve
import sys
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    host = os.getenv('HOST', '127.0.0.1')
    try:
        port = int(os.getenv('PORT', '5006'))
    except ValueError:
        port = 5006
    # Configure dual logging to console and file
    log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    log_file_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysnotes.log')
    
    # File handler
    file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
    file_handler.setFormatter(log_formatter)
    file_handler.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_formatter)
    console_handler.setLevel(logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    logger = logging.getLogger('waitress')
    
    logger.info("===================================================")
    logger.info("  Starting SysNotes Production Server")
    logger.info(f"  Listening on: http://{host}:{port}")
    logger.info("===================================================")
    
    try:
        serve(app, host=host, port=port, threads=4)
    except BaseException as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)
