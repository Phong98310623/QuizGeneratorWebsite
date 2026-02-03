<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1CkUiI4CNqi65tKlZsmKdGvnar37gwEIl

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


# Kiểm tra
python --version

# Cài dependencies
python -m pip install -r requirements.txt

# Chạy migrations
python manage.py migrate

# Chạy server
python manage.py runserver

Command đã sẵn sàng sử dụng. Chạy python manage.py create_admin để tạo tài khoản ADMIN test.