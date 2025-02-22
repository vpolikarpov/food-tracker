from flask import Blueprint, url_for, request, redirect, render_template
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import selectinload

import uuid

from webapp.database import db
from webapp.models import ActiveDay, Meal, FoodConsumptionRecord, FoodCategory, FoodStockRecord

bp = Blueprint('tracker', __name__)


@bp.route('/')
def home():
  return redirect(url_for('tracker.day'))


@bp.route('/day/', defaults={'date': None})
@bp.route('/day/<date>')
def day(date):
  today = datetime.today().date()

  if date:
    try:
      parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
      return "Invalid date format. Please use '%Y-%m-%d'."
  else:
    parsed_date = today

  active_days = db.session.execute(
    db.select(ActiveDay).order_by(ActiveDay.date)).scalars().all()

  date_str = None
  if parsed_date not in [day.date for day in active_days]:
    date_str = 'Add day'
  elif parsed_date == today:
    date_str = 'Today'
  elif parsed_date == today + timedelta(days=1):
    date_str = 'Tomorrow'

  default_new_date = None
  if parsed_date not in [day.date for day in active_days]:
    # If the selected date is not an active day, set it as the default new date
    default_new_date = parsed_date
  elif today not in [day.date for day in active_days]:
    # If today is not an active day, set it as the default new date
    default_new_date = today
  else:
    # Otherwise, set the default new date to the day after the last active day
    default_new_date = active_days[-1].date + timedelta(days=1)

  meals = db.session.execute(
    db.select(Meal).options(selectinload(Meal.food_items)).where(Meal.date == parsed_date).order_by(Meal.position)).scalars().all()
  categories = db.session.execute(
    db.select(FoodCategory).options(selectinload(FoodCategory.food_items)).order_by(FoodCategory.position)).scalars().all()
  stock_records = db.session.execute(
    db.select(FoodStockRecord)).scalars().all()

  return render_template(
    'tracker/day_page.html',
    date=parsed_date,
    date_str=date_str,
    active_days=active_days,
    default_new_date=default_new_date,
    meals=meals,
    categories=categories,
    stock_records=stock_records)


@bp.route('/day/add', methods=['POST'])
def set_active_date():
  selected_date = datetime.strptime(
    request.form.get('date'), '%Y-%m-%d').date()

  active_day = db.session.execute(
    db.select(ActiveDay).where(ActiveDay.date == selected_date)).scalar()

  if not active_day:
    new_active_date = ActiveDay(date=selected_date)
    db.session.add(new_active_date)

    # Check if there are any meals for the selected date
    existing_meals_count = db.session.execute(
      db.select(func.count(Meal.id)).where(Meal.date == selected_date)).scalar()

    if existing_meals_count == 0:
      # Get all meal templates and create meals for the selected date
      meal_templates = db.session.execute(
        db.select(Meal).options(selectinload(Meal.food_items)).where(Meal.date == None).order_by(Meal.position)).scalars()
      for meal_template in meal_templates:
        new_meal = Meal(
          date=selected_date,
          position=meal_template.position,
          name=meal_template.name
        )

        for template in meal_template.food_items:
          template.copy_to(new_meal)

        new_meal.recalculate_total_energy(commit=False)
        db.session.add(new_meal)

    db.session.commit()

  return redirect(url_for('tracker.day', date=selected_date.strftime('%Y-%m-%d')))


@bp.route('/day/remove', methods=['POST'])
def remove_active_date():
  active_day_date = datetime.strptime(
    request.form.get('date'), '%Y-%m-%d').date()

  active_day = db.get_or_404(ActiveDay, active_day_date)
  db.session.delete(active_day)
  db.session.commit()
  return redirect(url_for('tracker.day'))


@bp.route('/day/template')
def day_template():
  meals = db.session.execute(
    db.select(Meal).options(selectinload(Meal.food_items)).where(Meal.date == None).order_by(Meal.position)).scalars().all()
  categories = db.session.execute(
    db.select(FoodCategory).options(selectinload(FoodCategory.food_items)).order_by(FoodCategory.position)).scalars().all()
  stock_records = db.session.execute(
    db.select(FoodStockRecord)).scalars().all()

  return render_template(
    'tracker/day_template_page.html',
    meals=meals,
    categories=categories,
    stock_records=stock_records)


@bp.route('/food_consumed/add', methods=['POST'])
def add_food_consumed():
  meal_id = uuid.UUID(request.form.get('meal_id'))
  meal = db.get_or_404(Meal, meal_id)
  new_food = FoodConsumptionRecord(
    meal_id=meal_id,
    name=request.form.get('name'),
    amount_grams=nullable_int(request.form.get('amount_grams')),
    energy_per_100g=nullable_int(request.form.get('energy_per_100g')),
    energy_total=nullable_int(request.form.get('energy_total'))
  )
  db.session.add(new_food)
  meal.recalculate_total_energy(commit=False)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {
      'edit_url': url_for('tracker.edit_food_consumed', food_id=new_food.id),
      'delete_url': url_for('tracker.delete_food_consumed', food_id=new_food.id)
    }
  if not meal.date:
    return redirect(url_for('tracker.day_template'))
  else:
    return redirect(url_for('tracker.day', date=meal.date.strftime('%Y-%m-%d')))


@bp.route('/food_consumed/edit/<uuid:food_id>', methods=['POST'])
def edit_food_consumed(food_id):
  food = db.get_or_404(FoodConsumptionRecord, food_id)
  meal = food.meal
  food.name = request.form.get('name')
  food.amount_grams = nullable_int(request.form.get('amount_grams'))
  food.energy_per_100g = nullable_int(request.form.get('energy_per_100g'))
  food.energy_total = nullable_int(request.form.get('energy_total'))
  meal.recalculate_total_energy(commit=False)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {}
  if not meal.date:
    return redirect(url_for('tracker.day_template'))
  else:
    return redirect(url_for('tracker.day', date=meal.date.strftime('%Y-%m-%d')))


@bp.route('/food_consumed/delete/<uuid:food_id>', methods=['POST'])
def delete_food_consumed(food_id):
  food = db.get_or_404(FoodConsumptionRecord, food_id)
  meal = food.meal
  db.session.delete(food)
  meal.recalculate_total_energy(commit=False)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {}
  if not meal.date:
    return redirect(url_for('tracker.day_template'))
  else:
    return redirect(url_for('tracker.day', date=meal.date.strftime('%Y-%m-%d')))


def nullable_int(value):
  if value is None or value == '':
    return None
  return int(value)
