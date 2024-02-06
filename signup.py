from flask import Flask, render_template, request, redirect, url_for, flash,jsonify, session 
import sqlite3
from flask import Blueprint

signup_bp = Blueprint('signup', __name__)

def get_db_connection():
    conn = sqlite3.connect('testDB.db')
    return conn

@signup_bp.route('/signup', methods=['GET', 'POST'])
def register_user():

    # ログインしている場合は直ちに index.index にリダイレクト
    if 'user_id' in session:
        return redirect(url_for('index.index'))

    if request.method == 'POST':
        user_name = request.form['user_name'][:10]
        full_name = request.form['full_name'][:20]
        phone_number = request.form['phone_number'][:15]
        email_address = request.form['email_address'][:254]
        password = request.form['password'][:40]
        age = request.form['age'][:3]
        gender = request.form['gender']

        conn = get_db_connection()
        cursor = conn.cursor()

        # 電話番号またはメールアドレスが既にデータベースに存在するか確認
        cursor.execute(
            'SELECT * FROM users WHERE phone_number = ? OR email_address = ?',
            (phone_number, email_address)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            flash('同じ電話番号またはメールアドレスが既に登録されています。', 'error')
            return render_template('signup.html', form_data=request.form)

        cursor.execute(
            'INSERT INTO users (user_name, full_name, phone_number, email_address, password, age, gender,current_event_id,current_group_id,user_status) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?)',
            (user_name, full_name, phone_number, email_address, password, age, gender,0,0,'通常')
        )

        conn.commit()
        cursor.close()
        conn.close()

        flash('ユーザーが正常に登録されました。', 'success')
        return redirect(url_for('login.login_user'))
    
    return render_template('signup.html')

@signup_bp.route('/check_user', methods=['POST'])
def check_user():
    data = request.json
    phone_number = data.get('phone_number')
    email_address = data.get('email_address')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM users WHERE phone_number = ? OR email_address = ?',
        (phone_number, email_address)
    )
    existing_user = cursor.fetchone()
    cursor.close()
    conn.close()

    return jsonify({'user_exists': bool(existing_user)})