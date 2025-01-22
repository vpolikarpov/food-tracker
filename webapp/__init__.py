from flask import Flask
from dotenv import load_dotenv

from webapp import tracker, database, foods

load_dotenv()


def create_app():
  app = Flask(__name__)
  app.config.from_prefixed_env()

  database.db.init_app(app)

  app.register_blueprint(tracker.bp)
  app.register_blueprint(foods.bp)
  return app
