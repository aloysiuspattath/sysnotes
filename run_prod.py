from app import app
from cheroot.wsgi import Server as WSGIServer
from cheroot.ssl.builtin import BuiltinSSLAdapter
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
    
    logger = logging.getLogger('cheroot')
    
    cert_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cert.pem')
    key_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'key.pem')

    server = WSGIServer((host, port), app, numthreads=10)
    
    if os.path.exists(cert_path) and os.path.exists(key_path):
        server.ssl_adapter = BuiltinSSLAdapter(cert_path, key_path)
        scheme = "https"
    else:
        scheme = "http"
        logger.warning("SSL Certificates not found! Running in HTTP mode.")
    
    logger.info("===================================================")
    logger.info("  Starting SysNotes Production Server (Cheroot)")
    logger.info(f"  Listening on: {scheme}://{host}:{port}")
    logger.info("===================================================")
    
    try:
        server.start()
    except BaseException as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)
