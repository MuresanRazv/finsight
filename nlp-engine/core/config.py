from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    """
    # RabbitMQ
    RABBITMQ_HOST: str = Field("rabbitmq", env="RABBITMQ_HOST")
    RABBITMQ_PORT: int = Field(5672, env="RABBITMQ_PORT")
    RABBITMQ_USER: str = Field("guest", env="RABBITMQ_USER")
    RABBITMQ_PASS: str = Field("guest", env="RABBITMQ_PASS")
    QUEUE_RAW_NEWS: str = Field("raw_financial_news", env="QUEUE_RAW_NEWS")
    QUEUE_ANALYZED_SENTIMENT: str = Field("analyzed_sentiment", env="QUEUE_ANALYZED_SENTIMENT")

    # Redis
    REDIS_HOST: str = Field("redis", env="REDIS_HOST")
    REDIS_PORT: int = Field(6379, env="REDIS_PORT")

    # ChromaDB
    CHROMADB_HOST: str = Field("chromadb", env="CHROMADB_HOST")
    CHROMADB_PORT: int = Field(8000, env="CHROMADB_PORT")

    # RAG
    LLM_HOST: str = Field('http://host.docker.internal:11434', env='LLM_HOST')
    LLM_MODEL: str = Field('qwen3:8b', env='LLM_MODEL')

    class Config:
        env_file = ".env"

settings = Settings()
