import logging
import logging.handlers
import os
from datetime import datetime

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)

def setup_logging(service_name: str) -> logging.Logger:
    """Configure logging for a service with appropriate handlers and formatting"""
    
    logger = logging.getLogger(service_name)
    logger.setLevel(logging.INFO)

    # Remove any existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Log format that excludes sensitive data
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.WARNING)  # Only show warnings and errors in console
    
    # File handler - rotate daily and keep 30 days of logs
    log_file = os.path.join(LOGS_DIR, f"{service_name}_{datetime.now().strftime('%Y-%m-%d')}.log")
    file_handler = logging.handlers.TimedRotatingFileHandler(
        log_file,
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger