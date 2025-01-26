from flask_sqlalchemy import SQLAlchemy
from flask import current_app
import click

db = SQLAlchemy()


def init_app(app):
  app.cli.add_command(init_db_command)


@click.command("init-db")
def init_db_command():
  click.echo("Initializing the database...")
  click.echo("Database uri: " +
             current_app.config["SQLALCHEMY_DATABASE_URI"])
  with current_app.app_context():
    db.create_all()
  click.echo("Database initialized.")
