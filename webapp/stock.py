from flask import Blueprint, request, render_template, redirect, url_for
from webapp.models import FoodCategory, FoodItem, FoodStockRecord
from webapp.database import db
from sqlalchemy.orm import selectinload, joinedload
import uuid

bp = Blueprint('stock', __name__)


@bp.route('/stock/')
@bp.route('/stock/<int:category_id>')
def list(category_id=None):
  categories = db.session.execute(
    db.select(FoodCategory).options(selectinload(FoodCategory.food_items)).order_by(FoodCategory.position)).scalars().all()

  if category_id:
    stock_records = db.session.execute(
      db.select(FoodStockRecord).join(FoodStockRecord.food_item).where(FoodItem.category_id == category_id).order_by(FoodItem.name)).scalars().all()
    selected_category = (
      c for c in categories if c.id == category_id).__next__()
  else:
    stock_records = db.session.execute(
      db.select(FoodStockRecord).join(FoodStockRecord.food_item).order_by(FoodItem.name)).scalars().all()
    selected_category = None

  return render_template(
    'stock/stock_page.html',
    categories=categories,
    stock_records=stock_records,
    selected_category=selected_category)


@bp.route('/stock/<uuid:food_id>')
def get(food_id):
  food = db.get_or_404(FoodItem, food_id)
  stock_records = db.session.execute(
    db.select(FoodStockRecord).where(FoodStockRecord.food_item_id == food_id)).scalars()

  stock_records_dict = [record.to_dict() for record in stock_records]
  for record in stock_records_dict:
    record['edit_url'] = url_for('stock.edit', record_id=record['id'])
    record['delete_url'] = url_for('stock.delete', record_id=record['id'])

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return stock_records_dict

  return 'Bad request', 400

def redirect_based_on_origin(origin, category_id):
  if origin == 'category':
    return redirect(url_for('stock.list', category_id=category_id))
  else:
    return redirect(url_for('stock.list'))


@bp.route('/stock/edit/<uuid:record_id>', methods=['POST'])
def edit(record_id):
  stock_record = db.session.execute(
    db.select(FoodStockRecord).options(joinedload(FoodStockRecord.food_item).load_only(FoodItem.category_id)).where(FoodStockRecord.id == record_id)).scalar_one()
  category_id = stock_record.food_item.category_id

  stock_record.amount_note = request.form.get('amount_note', '')
  stock_record.date_note = request.form.get('date_note', '')
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {}

  origin = request.form.get('origin')
  return redirect_based_on_origin(origin, category_id)


@bp.route('/stock/add', methods=['POST'])
def add():
  food_item_id = uuid.UUID(request.form.get('food_item_id'))
  food_item = db.get_or_404(FoodItem, food_item_id)
  stock_record = FoodStockRecord(
    food_item=food_item,
    amount_note=request.form.get('amount_note', ''),
    date_note=request.form.get('date_note', '')
  )
  db.session.add(stock_record)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {
      'edit_url': url_for('stock.edit', record_id=stock_record.id),
      'delete_url': url_for('stock.delete', record_id=stock_record.id)
    }

  origin = request.form.get('origin')
  return redirect_based_on_origin(origin, food_item.category_id)


@bp.route('/stock/delete/<uuid:record_id>', methods=['POST'])
def delete(record_id):
  stock_record = db.session.execute(
    db.select(FoodStockRecord).options(joinedload(FoodStockRecord.food_item).load_only(FoodItem.category_id)).where(FoodStockRecord.id == record_id)).scalar_one()
  category_id = stock_record.food_item.category_id

  db.session.delete(stock_record)
  db.session.commit()

  if request.headers.get('X-Requested-With') == 'FetchAPI':
    return {}

  origin = request.form.get('origin')
  return redirect_based_on_origin(origin, category_id)


def nullable_int(value):
  if value is None or value == '':
    return None
  return int(value)
