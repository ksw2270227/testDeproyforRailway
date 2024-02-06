from flask import Blueprint, render_template, request, redirect, url_for, session, flash
import sqlite3
from flask import jsonify


login_bp = Blueprint('login', __name__)

def get_db_connection():
    conn = sqlite3.connect('testDB.db')
    return conn

@login_bp.route('/login', methods=['GET', 'POST'])
def login_user():
    error = None
    if request.method == 'POST':
        email_address = request.form['email_address']
        password = request.form['password']
        conn = get_db_connection()
        cursor = conn.cursor()

        # ユーザーを検索
        cursor.execute(
            'SELECT * FROM users WHERE email_address = ? AND password = ?',(email_address, password)
        )
        user = cursor.fetchone()
        print(user)
        cursor.close()
        conn.close()

        if user:
            # ユーザーIDをセッションに格納
            session['user_id'] = user[0]
            session['user_name'] = user[1]
            session['role']='User'
            # ログイン成功時のリダイレクト先（例：indexページ）
            return redirect(url_for('index.index'))
        else:
            # ログイン失敗時のエラーメッセージ
            error = '無効なメールアドレスまたはパスワードです。'
            test =1
            return render_template("login.html",error=error,test=test)
    else :
        return render_template("login.html")     

# 既存のlogin_user関数はそのままに、以下にログアウト処理を追加
# @login_bp.route('/logout', methods=['POST'])
# def logout_user():
#     # ログインしているかどうかの判定
#     if 'user_id' not in session:
#         # ログインしていない場合、ログアウトエラーのレスポンスを返す
#         return jsonify({'success': False, 'error': 'ログアウトしていません'})

#     # セッションからユーザー情報を削除
#     session.pop('user_id', None)
#     session.pop('user_name', None)
#     session.pop('role', None)

#     # ログアウト成功時のレスポンスを返す
#     return jsonify({'success': True})


