from flask import Blueprint, url_for, request, redirect, render_template
from datetime import datetime, timedelta
import uuid

from webapp.database import db
from webapp.models import ActiveDay, Meal, MealType, FoodItemConsumed

bp = Blueprint('tracker', __name__)


@bp.route('/')
def home():
  return redirect(url_for('tracker.day'))

@bp.route('/day/', defaults={'date': None})
@bp.route('/day/<date>')
def day(date):
  if date:
    try:
      parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
      return "Invalid date format. Please use '%Y-%m-%d'."
  else:
    parsed_date = datetime.today().date()

  prev_date = (parsed_date - timedelta(days=1))
  next_date = (parsed_date + timedelta(days=1))

  active_days = ActiveDay.query.order_by(ActiveDay.date).all()
  default_new_date = parsed_date if parsed_date not in [
    day.date for day in active_days] else None
  meals = Meal.query.filter_by(date=parsed_date).order_by(Meal.order).all()

  return render_template(
    'day.html',
    date=parsed_date,
    prev_date=prev_date,
    next_date=next_date,
    active_days=active_days,
    default_new_date=default_new_date,
    meals=meals)

@bp.route('/set_active_date', methods=['POST'])
def set_active_date():
  selected_date = request.form['date']
  parsed_date = datetime.strptime(selected_date, '%Y-%m-%d').date()

  if not ActiveDay.query.get(parsed_date):
    new_active_date = ActiveDay(date=parsed_date)
    db.session.add(new_active_date)

    # Check if there are any meals for the selected date
    existing_meals = Meal.query.filter_by(date=parsed_date).all()
    if not existing_meals:
      # Get all meal types and create meals for the selected date
      meal_types = MealType.query.order_by(MealType.order).all()
      for meal_type in meal_types:
        new_meal = Meal(date=parsed_date,
                        order=meal_type.order, name=meal_type.name)
        db.session.add(new_meal)

    db.session.commit()

  return redirect(url_for('tracker.day', date=parsed_date.strftime('%Y-%m-%d')))


@bp.route('/add_food_consumed', methods=['POST'])
def add_food_consumed():
  meal_id = uuid.UUID(request.form['meal_id'])
  meal = Meal.query.get_or_404(meal_id)
  new_food = FoodItemConsumed(
    meal_id=meal_id,
    name=request.form['name'],
    amount_grams=request.form['amount_grams'],
    energy_per_100g=request.form['energy_per_100g'],
    energy_total=request.form['energy_total']
  )
  db.session.add(new_food)
  db.session.commit()
  meal.recalculate_total_energy()
  return redirect(url_for('tracker.day', date=meal.date.strftime('%Y-%m-%d')))


@bp.route('/edit_food_consumed/<uuid:food_id>', methods=['POST'])
def edit_food_consumed(food_id):
  food = FoodItemConsumed.query.get_or_404(food_id)
  meal = Meal.query.get_or_404(food.meal_id)
  food.name = request.form['name']
  food.amount_grams = request.form['amount_grams']
  food.energy_per_100g = request.form['energy_per_100g']
  food.energy_total = request.form['energy_total']
  db.session.commit()
  meal.recalculate_total_energy()
  return redirect(url_for('tracker.day', date=meal.date.strftime('%Y-%m-%d')))


@bp.route('/delete_food_consumed/<uuid:food_id>', methods=['POST'])
def delete_food_consumed(food_id):
  food = FoodItemConsumed.query.get_or_404(food_id)
  meal = Meal.query.get_or_404(food.meal_id)
  db.session.delete(food)
  db.session.commit()
  meal.recalculate_total_energy()
  return redirect(url_for('tracker.day', date=meal.date.strftime('%Y-%m-%d')))
