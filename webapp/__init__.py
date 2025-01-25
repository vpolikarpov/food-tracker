from flask import Flask
from dotenv import load_dotenv

from webapp import tracker, database, foods

load_dotenv()


def create_app():
  app = Flask(__name__)
  app.config.from_prefixed_env()

  # Initialize database
  database.db.init_app(app)

  # Register click commands
  app.cli.add_command(database.init_db_command)

  # Register blueprints
  app.register_blueprint(tracker.bp)
  app.register_blueprint(foods.bp)

  return app
