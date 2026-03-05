# backend/env_manager.py
import os
from typing import Dict

BACKEND_ENV = "../backend/.env"
FRONTEND_ENV = "../frontend/.env"

def read_env(file_path: str) -> Dict[str, str]:
    env = {}
    if os.path.exists(file_path):
        with open(file_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env[key] = value
    return env

def write_env(file_path: str, new_env: Dict[str, str]):
    lines = []
    existing_env = read_env(file_path)
    existing_env.update(new_env)
    for k, v in existing_env.items():
        lines.append(f"{k}={v}")
    with open(file_path, "w") as f:
        f.write("\n".join(lines))
