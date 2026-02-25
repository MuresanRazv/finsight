import pika
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

class RabbitMQConnection:
    """
    Singleton class to manage RabbitMQ connection and channel.
    """
    _instance: Optional['RabbitMQConnection'] = None
    _connection: Optional[pika.BlockingConnection] = None
    _channel: Optional[pika.adapters.blocking_connection.BlockingChannel] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RabbitMQConnection, cls).__new__(cls)
        return cls._instance

    def connect(self):
        """
        Establishes a connection to RabbitMQ if not already connected.
        """
        if self._connection and not self._connection.is_closed:
            return

        try:
            credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASS)
            parameters = pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                credentials=credentials
            )
            self._connection = pika.BlockingConnection(parameters)
            self._channel = self._connection.channel()
            
            # Declare queues to ensure they exist
            self._channel.queue_declare(queue=settings.QUEUE_RAW_NEWS, durable=True)
            self._channel.queue_declare(queue=settings.QUEUE_ANALYZED_SENTIMENT, durable=True)
            
            logger.info("Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    def get_channel(self) -> pika.adapters.blocking_connection.BlockingChannel:
        """
        Returns the active channel. Connects if necessary.
        """
        if self._channel is None or self._channel.is_closed:
            self.connect()
        return self._channel

    def close(self):
        """
        Closes the connection.
        """
        if self._connection and not self._connection.is_closed:
            self._connection.close()
            logger.info("Closed RabbitMQ connection")

rabbitmq_client = RabbitMQConnection()
