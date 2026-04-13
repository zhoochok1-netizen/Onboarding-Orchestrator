from pathlib import Path
from pydantic_settings import BaseSettings

_backend_root = Path(__file__).resolve().parent
_repo_root = _backend_root.parent
_env_candidates = [_repo_root / ".env", _backend_root / ".env"]
ENV_FILE = next((p for p in _env_candidates if p.is_file()), _env_candidates[0])

_model_config_kwargs = {
    "env_file_encoding": "utf-8",
    "extra": "ignore",
}
if ENV_FILE.is_file():
    _model_config_kwargs["env_file"] = str(ENV_FILE)


class Settings(BaseSettings):
    gateway_token: str = ""
    gateway_base_url: str = "https://openrouter.ai/api/v1"
    gateway_model: str = "google/gemini-2.5-flash"

    model_config = _model_config_kwargs


settings = Settings()
