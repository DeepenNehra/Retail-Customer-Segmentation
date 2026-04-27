#!/usr/bin/env bash
# exit on error
set -o errexit

# Render runs this script from the repo root, so we must cd into backend first
cd backend

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
