# group.py

from flask import Blueprint, render_template, session, jsonify, current_app, redirect, url_for
import sqlite3

group_bp = Blueprint('group', __name__)

def get_db_connection():
    conn = sqlite3.connect('testDB.db')
    return conn

# group.py

@group_bp.route('/group', methods=['GET'])
def group_page():
    user_id = session.get('user_id')

    if user_id is not None:
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute('SELECT current_group_id FROM users WHERE user_id = ?', (user_id,))
            current_group_id = cursor.fetchone()

            if current_group_id:
                current_group_id = current_group_id[0]

                if current_group_id == 0 or current_group_id is None:
                    # current_group_idが0もしくはNoneの場合、/joingroupにリダイレクト
                    return redirect(url_for('joingroup.join_group'))

                cursor.execute('SELECT * FROM groups WHERE group_id = ?', (current_group_id,))
                group = cursor.fetchone()

                if group:
                    group_data = {
                        'group_name': group[1],
                        'group_id': group[0],
                        'max_members': group[5]
                    }

                    # Add the following lines to get the participant count
                    cursor.execute('SELECT COUNT(*) FROM users WHERE current_group_id = ?', (current_group_id,))
                    group_count = cursor.fetchone()[0]

                    # Add the following lines to get the list of participants
                    cursor.execute('SELECT full_name FROM users WHERE current_group_id = ?', (current_group_id,))
                    participants = [{'full_name': row[0]} for row in cursor.fetchall()]

                    # Render the group.html template with the group data, count, and participants
                    return render_template('group.html', group=group_data, group_count=group_count, participants=participants)
                else:
                    # Return a response even if group data is not found
                    return render_template('group.html', group=None, group_count=None, participants=None)
            else:
                return jsonify({'success': False, 'error': 'ユーザーはグループに所属していません'})
        except Exception as e:
            current_app.logger.error(f"Error fetching group data: {str(e)}")
            return jsonify({'success': False, 'error': str(e)})
        finally:
            cursor.close()
            conn.close()
    else:
        return redirect(url_for('login.login_user'))