from webapp.database import db
from sqlalchemy.event import listens_for

import uuid
import os
import csv


class FoodCategory(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(100), nullable=False)
  order = db.Column(db.Integer, nullable=False, unique=True)
  food_items = db.relationship('FoodItem', backref='category', lazy=True)

  def __repr__(self):
    return f'<FoodCategory {self.name}>'


class FoodItem(db.Model):
  id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  name = db.Column(db.String(100), nullable=False)
  category_id = db.Column(db.Integer, db.ForeignKey(
    'food_category.id'), nullable=False)
  portion_grams = db.Column(db.Integer, nullable=False)
  energy_per_100g = db.Column(db.Integer, nullable=False)
  energy_per_portion = db.Column(db.Integer, nullable=False)
  comment = db.Column(db.String(200))
  stock_amount = db.Column(db.String(20))
  due_date = db.Column(db.String(30))

  def __repr__(self):
    return f'<FoodEntry {self.name}>'


class FoodItemConsumed(db.Model):
  id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  meal_id = db.Column(db.UUID(as_uuid=True),
                      db.ForeignKey('meal.id'), nullable=False)
  name = db.Column(db.String(100), nullable=False)
  amount_grams = db.Column(db.Integer)
  energy_per_100g = db.Column(db.Integer)
  energy_total = db.Column(db.Integer)

  def __repr__(self):
    return f'<FoodItemConsumed {self.date} - {self.food_item_id}>'


class MealTemplate(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(100), nullable=False)
  order = db.Column(db.Integer, nullable=False, unique=True)

  def __repr__(self):
    return f'<MealTemplate {self.name}>'


class Meal(db.Model):
  id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  date = db.Column(db.Date, nullable=False)
  order = db.Column(db.Integer, nullable=False)
  name = db.Column(db.String(100), nullable=False)
  total_energy = db.Column(db.Integer, nullable=False, default=0)
  food_items = db.relationship('FoodItemConsumed', backref='meal', lazy=True)

  def recalculate_total_energy(self):
    self.total_energy = sum((food.energy_total or 0)
                            for food in self.food_items)
    db.session.commit()

  def __repr__(self):
    return f'<Meal {self.date} - {self.name}>'


class ActiveDay(db.Model):
  date = db.Column(db.Date, primary_key=True)

  def __repr__(self):
    return f'<ActiveDay {self.date}>'


@listens_for(FoodCategory.__table__, 'after_create')
def insert_initial_values(*args, **kwargs):
  load_csv_data(FoodCategory, 'data/food_categories.csv')


@listens_for(MealTemplate.__table__, 'after_create')
def insert_initial_values(*args, **kwargs):
  load_csv_data(MealTemplate, 'data/meal_templates.csv')


def load_csv_data(model, file_path):
  if os.path.exists(file_path):
    with open(file_path, mode='r') as file:
      reader = csv.DictReader(file)
      for row in reader:
        db.session.add(model(**row))
    db.session.commit()
  else:
    print(f"File {file_path} not found. Skipping initial data load for {
          model.__name__}.")
