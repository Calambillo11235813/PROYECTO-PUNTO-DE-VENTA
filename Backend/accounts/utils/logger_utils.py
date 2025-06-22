import logging
import os
from django.conf import settings

def get_log_path_por_usuario(usuario_id):
    carpeta = os.path.join(settings.LOGS_DIR, f"usuario_{usuario_id}")
    os.makedirs(carpeta, exist_ok=True)
    return os.path.join(carpeta, 'bitacora.log')

def get_logger_por_usuario(usuario_id):
    nombre_logger = f'bitacora_usuario_{usuario_id}'
    logger = logging.getLogger(nombre_logger)

    if not logger.handlers:
        ruta_log = get_log_path_por_usuario(usuario_id)
        handler = logging.FileHandler(ruta_log)
        formatter = logging.Formatter('[%(asctime)s] %(levelname)s - %(message)s', style='%')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False

    return logger
