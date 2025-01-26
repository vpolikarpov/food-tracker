from flask import Blueprint, url_for, request, redirect, render_template
from datetime import datetime, timedelta
import uuid

from webapp.database import db
from webapp.models import ActiveDay, Meal, MealTemplate, FoodItemConsumed, FoodCategory, FoodItem

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

  active_days = ActiveDay.query.order_by(ActiveDay.date).all()

  default_new_date = None
  if today not in [day.date for day in active_days]:
    # If today is not an active day, set it as the default new date
    default_new_date = today
  elif parsed_date not in [day.date for day in active_days]:
    # If the selected date is not an active day, set it as the default new date
    default_new_date = parsed_date
  else:
    # Otherwise, set the default new date to the day after the last active day
    default_new_date = active_days[-1].date + timedelta(days=1)

  # Display meals only if the selected date is an active day
  if parsed_date in [day.date for day in active_days]:
    meals = Meal.query.filter_by(date=parsed_date).order_by(Meal.order).all()
    food_categories = FoodCategory.query.order_by(FoodCategory.order).all()
  else:
    meals = []
    food_categories = []

  return render_template(
    'tracker/day_page.html',
    date=parsed_date,
    active_days=active_days,
    default_new_date=default_new_date,
    meals=meals,
    food_categories=food_categories)

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
      # Get all meal templates and create meals for the selected date
      meal_templates = MealTemplate.query.order_by(MealTemplate.order).all()
      for meal_template in meal_templates:
        new_meal = Meal(date=parsed_date,
                        order=meal_template.order, name=meal_template.name)
        db.session.add(new_meal)

    db.session.commit()

  return redirect(url_for('tracker.day', date=parsed_date.strftime('%Y-%m-%d')))


@bp.route('/remove_active_date/<date>', methods=['POST'])
def remove_active_date(date):
  parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
  active_day = ActiveDay.query.get_or_404(parsed_date)
  db.session.delete(active_day)
  db.session.commit()
  return redirect(url_for('tracker.day'))


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
