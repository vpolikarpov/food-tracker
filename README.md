# Food Tracker

![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

Food Tracker is a simple web application designed to help users track the food they eat and monitor their daily nutritional intake. It doesn't limit users to a specific list of foods and allows them to input anything they eat. For extra convenience, users can manage their own food database for easy access to their favorite foods. The application allows editing records at any time, so users can easily plan their meals in advance or make records after the fact. It also allows users to configure templates for typical daily meals, such as breakfast, lunch, and dinner.

## Features

- Track the food you eat
- Monitor your daily nutritional intake
- Manage your own food database
- Track stock and expiration dates of food items (optional)
- Add short notes to each food item in the database (optional)
- Configure templates for each daily meal

## Why another food tracker?

There are many food tracking applications available, but most of them are either too complex or too limited. This application is designed to be simple and easy to use, without requiring users to input detailed information about each food item. It also allows adding any volatile food items without the need to predefine them, while still providing the ability to manage a personal food database for easy access to favorite foods.

## What it does not

It does not provide any nutritional advice or recommendations. It is up to the user to interpret the data and make informed decisions about their diet.

It does not provide any meal suggestions or recipes. It is designed for users who already know what they are eating and want to track their intake.

It does not provide a way to store food item details such as protein, fat, fiber, etc. It is designed to be simple and easy to use, without requiring users to input detailed information about each food item. The application only allows inputting the name, quantity and energy value of the food in kcal and none of these are mandatory.

It does not provide any user authentication or authorization. It is designed for personal use and does not support multiple users.

## Technologies

- Python
- Flask
- SQLAlchemy
- Bootstrap

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/vpolikarpov/food-tracker.git
   cd food-tracker
   ```

1. Create a virtual environment, activate it, and install the dependencies:

   ```sh
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

1. Adjust initial data in the `data/` directory if needed.
   Use `food_categories.csv` to define food categories and
   `meal_templates.csv` to define what kind of meals you want to track during the day.

1. Set up the environment variables. Make a copy of the `.env.example` file and name it `.env`:

   ```sh
   cp .env.example .env
   ```

   Generate a secret key and set the `SECRET_KEY` variable in the `.env` file. You can generate a secret key using the following command:

   ```sh
   python -c 'import secrets; print(secrets.token_hex())'
   ```

  Adjust other variables in the `.env` file if needed.

1. Initialize the database:

   ```sh
   flask --app webapp init-db
   ```

## Usage

1. Run the application:

   ```sh
   flask run
   ```

1. Open your web browser and go to `http://127.0.0.1:5000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
