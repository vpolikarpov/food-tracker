from flask import Blueprint, request, render_template, redirect, url_for
from webapp.models import FoodCategory, FoodItem, FoodStockRecord
from webapp.database import db

bp = Blueprint('foods', __name__)


@bp.route('/foods/')
@bp.route('/foods/<int:category_id>')
def list(category_id=None):
  categories = db.session.execute(
    db.select(FoodCategory).order_by(FoodCategory.position)).scalars().all()
  if category_id:
    foods = db.session.execute(
      db.select(FoodItem).where(FoodItem.category_id == category_id).order_by(FoodItem.name)).scalars().all()
    selected_category = db.session.execute(
      db.select(FoodCategory).where(FoodCategory.id == category_id)).scalar()
  else:
    foods = db.session.execute(
      db.select(FoodItem).order_by(FoodItem.name)).scalars().all()
    selected_category = None

  stock_records = db.session.execute(
    db.select(FoodStockRecord)).scalars().all()

  return render_template(
    'foods/foods_page.html',
    categories=categories,
    foods=foods,
    stock_records=stock_records,
    selected_category=selected_category)


@bp.route('/foods/<uuid:food_id>')
def get(food_id):
  food = db.get_or_404(FoodItem, food_id)
  category = db.session.execute(
    db.select(FoodCategory).where(FoodCategory.id == food.category_id)).scalar()

  food_dict = food.to_dict()
  food_dict['category_name'] = category.name

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return food_dict

  return 'Bad request', 400

def redirect_based_on_origin(origin, category_id):
  if origin == 'category':
    return redirect(url_for('foods.list', category_id=category_id))
  else:
    return redirect(url_for('foods.list'))


@bp.route('/foods/edit/<uuid:food_id>', methods=['POST'])
def edit_food(food_id):
  food = db.get_or_404(FoodItem, food_id)
  food.name = request.form.get('name')
  food.portion_grams = nullable_int(request.form.get('portion_grams'))
  food.energy_per_100g = nullable_int(request.form.get('energy_per_100g'))
  food.energy_per_portion = nullable_int(
    request.form.get('energy_per_portion'))
  food.note = request.form.get('note', '')
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {}

  origin = request.form.get('origin')
  return redirect_based_on_origin(origin, food.category_id)


@bp.route('/foods/add', methods=['POST'])
def add_food():
  category_id = int(request.form.get('category_id'))
  new_food = FoodItem(
    name=request.form.get('name'),
    portion_grams=nullable_int(request.form.get('portion_grams')),
    energy_per_100g=nullable_int(request.form.get('energy_per_100g')),
    energy_per_portion=nullable_int(request.form.get('energy_per_portion')),
    note=request.form.get('note', ''),
    category_id=category_id
  )
  db.session.add(new_food)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {
      'edit_url': url_for('foods.edit_food', food_id=new_food.id),
      'delete_url': url_for('foods.delete_food', food_id=new_food.id)
    }

  origin = request.form.get('origin')
  return redirect_based_on_origin(origin, category_id)


@bp.route('/foods/delete/<uuid:food_id>', methods=['POST'])
def delete_food(food_id):
  food = db.get_or_404(FoodItem, food_id)
  category_id = food.category_id
  db.session.delete(food)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {}

  origin = request.form.get('origin')
  return redirect_based_on_origin(origin, category_id)


def nullable_int(value):
  if value is None or value == '':
    return None
  return int(value)
