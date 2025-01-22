from flask import Blueprint, request, render_template, redirect, url_for
from webapp.models import FoodCategory, FoodItem
from webapp.database import db
import uuid

bp = Blueprint('foods', __name__)


@bp.route('/foods/')
@bp.route('/foods/<int:category_id>')
def list(category_id=None):
  categories = FoodCategory.query.order_by(FoodCategory.name).all()
  if category_id:
    foods = FoodItem.query.filter_by(
      category_id=category_id).order_by(FoodItem.name).all()
    selected_category = FoodCategory.query.get(category_id)
  else:
    foods = FoodItem.query.order_by(FoodItem.name).all()
    selected_category = None

  return render_template('foods.html', categories=categories, foods=foods, selected_category=selected_category)


def redirect_based_on_origin(origin, category_id):
  if origin == 'category':
    return redirect(url_for('foods.list', category_id=category_id))
  else:
    return redirect(url_for('foods.list'))


@bp.route('/foods/edit/<uuid:food_id>', methods=['POST'])
def edit_food(food_id):
  food = FoodItem.query.get_or_404(food_id)
  food.name = request.form['name']
  food.portion_grams = request.form['portion_grams']
  food.energy_per_100g = request.form['energy_per_100g']
  food.energy_per_portion = request.form['energy_per_portion']
  food.comment = request.form['comment']
  db.session.commit()

  origin = request.form['origin']
  return redirect_based_on_origin(origin, food.category_id)


@bp.route('/foods/add', methods=['POST'])
def add_food():
  category_id = request.form['category_id']
  new_food = FoodItem(
    id=uuid.uuid4(),
    name=request.form['name'],
    portion_grams=request.form['portion_grams'],
    energy_per_100g=request.form['energy_per_100g'],
    energy_per_portion=request.form['energy_per_portion'],
    comment=request.form['comment'],
    category_id=category_id
  )
  db.session.add(new_food)
  db.session.commit()

  origin = request.form['origin']
  return redirect_based_on_origin(origin, category_id)


@bp.route('/foods/delete/<uuid:food_id>', methods=['POST'])
def delete_food(food_id):
  food = FoodItem.query.get_or_404(food_id)
  category_id = food.category_id
  db.session.delete(food)
  db.session.commit()

  origin = request.form['origin']
  return redirect_based_on_origin(origin, category_id)
