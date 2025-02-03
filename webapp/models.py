from webapp.database import db
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.event import listens_for
from sqlalchemy.schema import Table

from typing import List, Optional

from datetime import date as date_type

import uuid
import os
import csv


class FoodCategory(db.Model):
  __tablename__ = 'food_category'

  id: Mapped[int] = mapped_column(primary_key=True)
  name: Mapped[str] = mapped_column(String(100), nullable=False)
  position: Mapped[int] = mapped_column(unique=True)

  food_items: Mapped[List['FoodItem']] = relationship(
    back_populates='category', order_by='FoodItem.name')

  def __repr__(self):
    return f'<FoodCategory #{self.id} - {self.name}>'


class FoodItem(db.Model):
  __tablename__ = 'food'

  id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(100), nullable=False)
  category_id: Mapped[int] = mapped_column(ForeignKey('food_category.id'))
  portion_grams: Mapped[Optional[int]] = mapped_column()
  energy_per_100g: Mapped[Optional[int]] = mapped_column()
  energy_per_portion: Mapped[Optional[int]] = mapped_column()
  note: Mapped[str] = mapped_column(String(200))
  stock_amount: Mapped[str] = mapped_column(String(20))
  due_date: Mapped[str] = mapped_column(String(30))

  category: Mapped["FoodCategory"] = relationship(back_populates='food_items')

  def __repr__(self):
    return f'<FoodItem - {self.name}>'


class FoodConsumptionRecord(db.Model):
  __tablename__ = 'food_consumption'

  id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
  meal_id: Mapped[uuid.UUID] = mapped_column(
    ForeignKey('meal.id'), nullable=False)
  name: Mapped[str] = mapped_column(String(100))
  amount_grams: Mapped[Optional[int]] = mapped_column()
  energy_per_100g: Mapped[Optional[int]] = mapped_column()
  energy_total: Mapped[Optional[int]] = mapped_column()

  meal: Mapped["Meal"] = relationship(back_populates='food_items')

  def copy_to(self, meal):
    return FoodConsumptionRecord(
      meal=meal,
      name=self.name,
      amount_grams=self.amount_grams,
      energy_per_100g=self.energy_per_100g,
      energy_total=self.energy_total
    )

  def __repr__(self):
    return f'<FoodConsumptionRecord {self.id} - {self.name}>'


class Meal(db.Model):
  __tablename__ = 'meal'

  __table_args__ = (UniqueConstraint('date', 'position'),)

  id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
  date: Mapped[Optional[date_type]] = mapped_column(nullable=True)
  position: Mapped[int] = mapped_column(nullable=False)
  name: Mapped[str] = mapped_column(String(100), nullable=False)
  energy: Mapped[int] = mapped_column(nullable=False, default=0)

  food_items: Mapped[List['FoodConsumptionRecord']] = relationship(
    back_populates='meal', cascade='all, delete-orphan')

  def recalculate_total_energy(self, commit=True):
    self.energy = sum((food.energy_total or 0)
                      for food in self.food_items)
    if commit:
      db.session.commit()

  def __repr__(self):
    return f'<Meal {self.date}#{self.position} - {self.name}>'


class ActiveDay(db.Model):
  __tablename__ = 'day'

  date: Mapped[date_type] = mapped_column(primary_key=True)

  def __repr__(self):
    return f'<ActiveDay {self.date}>'


@listens_for(FoodCategory.__table__, 'after_create')
def insert_initial_values(target, connection, **kw):
  load_csv_data(target, connection, 'data/food_categories.csv')


@listens_for(Meal.__table__, 'after_create')
def insert_initial_values(target, connection, **kw):
  load_csv_data(target, connection, 'data/meal_templates.csv')


def load_csv_data(database_table: Table, connection, file_path):
  if os.path.exists(file_path):
    with open(file_path, mode='r') as file:
      reader = csv.DictReader(file)
      for row in reader:
        connection.execute(database_table.insert().values(**row))
    print("Initial data loaded for {}.".format(database_table.name))
  else:
    print("File {} not found. Skipping initial data load for {}.".format(
      file_path, database_table.name))
