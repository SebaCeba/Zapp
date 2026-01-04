from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import io
import csv
import sqlite3
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'subscriptions.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            periodicity TEXT NOT NULL,
            start_date TEXT,
            start_date_id INTEGER
        )
    ''')
    # calendar table for dates
    cur.execute('''
        CREATE TABLE IF NOT EXISTS calendar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE
        )
    ''')
    # price overrides: subscription-specific monthly price changes
    cur.execute('''
        CREATE TABLE IF NOT EXISTS price_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subscription_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            price REAL NOT NULL,
            UNIQUE(subscription_id, year, month)
        )
    ''')
    conn.commit()
    # ensure calendar has a reasonable date range (from current_year-1 to current_year+3)
    now_year = datetime.now().year
    start_year = now_year - 1
    end_year = now_year + 3
    # check if calendar has entries; if empty, populate
    cur.execute('SELECT COUNT(*) FROM calendar')
    c = cur.fetchone()[0]
    if c == 0:
        d = date(start_year, 1, 1)
        end_date = date(end_year, 12, 31)
        while d <= end_date:
            cur.execute('INSERT OR IGNORE INTO calendar (date) VALUES (?)', (d.isoformat(),))
            d = d + relativedelta(days=+1)
        conn.commit()

    # ensure subscriptions has start_date_id column; if not, add it
    cur.execute("PRAGMA table_info('subscriptions')")
    cols = [r[1] for r in cur.fetchall()]
    if 'start_date_id' not in cols:
        cur.execute('ALTER TABLE subscriptions ADD COLUMN start_date_id INTEGER')
        conn.commit()

    # populate missing start_date_id using start_date string
    cur.execute('SELECT id, start_date FROM subscriptions WHERE start_date IS NOT NULL AND (start_date_id IS NULL OR start_date_id=0)')
    rows = cur.fetchall()
    for rid, sdate in rows:
        try:
            # ensure date exists in calendar
            cur.execute('SELECT id FROM calendar WHERE date = ?', (sdate,))
            res = cur.fetchone()
            if res:
                cid = res[0]
            else:
                cur.execute('INSERT INTO calendar (date) VALUES (?)', (sdate,))
                cid = cur.lastrowid
            cur.execute('UPDATE subscriptions SET start_date_id = ? WHERE id = ?', (cid, rid))
        except Exception:
            continue
    conn.commit()

    conn.close()


def get_all_subscriptions():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # join calendar to obtain normalized start_date
    cur.execute('''SELECT s.id, s.name, s.price, s.periodicity, c.date
                   FROM subscriptions s
                   LEFT JOIN calendar c ON s.start_date_id = c.id
                   ORDER BY s.name''')
    rows = cur.fetchall()
    conn.close()
    subs = []
    for r in rows:
        # convert start_date from ISO string to date; if missing, fallback to today
        try:
            sd = datetime.strptime(r[4], '%Y-%m-%d').date() if r[4] else date.today()
        except Exception:
            sd = date.today()
        subs.append({"id": r[0], "name": r[1], "price": float(r[2]) if r[2] is not None else 0.0, "periodicity": r[3], "start_date": sd})
    return subs


def get_overrides_for_sub_year(subscription_id, year):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT month, price FROM price_overrides WHERE subscription_id = ? AND year = ?', (subscription_id, year))
    rows = cur.fetchall()
    conn.close()
    d = {}
    for m, p in rows:
        try:
            d[int(m)] = float(p)
        except Exception:
            continue
    return d


def set_price_override(subscription_id, year, month, price):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # insert or replace the override
    cur.execute('INSERT INTO price_overrides (subscription_id, year, month, price) VALUES (?,?,?,?)'
                ' ON CONFLICT(subscription_id, year, month) DO UPDATE SET price=excluded.price',
                (subscription_id, year, month, float(price)))
    conn.commit()
    conn.close()


def add_subscription_db(name, price, periodicity, start_date):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # ensure calendar entry exists and get id
    cur.execute('SELECT id FROM calendar WHERE date = ?', (start_date.isoformat(),))
    res = cur.fetchone()
    if res:
        cid = res[0]
    else:
        cur.execute('INSERT INTO calendar (date) VALUES (?)', (start_date.isoformat(),))
        cid = cur.lastrowid
    cur.execute('INSERT INTO subscriptions (name,price,periodicity,start_date,start_date_id) VALUES (?,?,?,?,?)',
                (name, float(price), periodicity, start_date.isoformat(), cid))
    conn.commit()
    conn.close()


def count_subscriptions():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM subscriptions')
    c = cur.fetchone()[0]
    conn.close()
    return c


init_db()


@app.route("/",
methods=["GET"])
def index():
    return render_template('home.html')


## La home ahora está en /home


@app.route('/api/year-data', methods=['GET'])
def api_year_data():
    year = int(request.args.get('year', datetime.now().year))
    subs = get_all_subscriptions()

    # monthly totals and counts (integers, pesos sin centavos)
    monthly_totals = [0] * 12
    monthly_counts = [0] * 12
    per_subscription = []
    per_subscription_monthly = []

    for sub in subs:
        monthly = [0] * 12
        # consider overrides per subscription for the requested year
        overrides = get_overrides_for_sub_year(sub.get('id'), year)
        for occ in _iter_occurrences(sub, year):
            idx = occ.month - 1
            if (occ.month) in overrides:
                val = int(round(float(overrides.get(occ.month, 0))))
            else:
                val = int(round(float(sub.get('price', 0))))
            monthly[idx] += val
            monthly_counts[idx] += 1
            monthly_totals[idx] += val
        total = sum(monthly)
        per_subscription.append({'name': sub.get('name',''), 'total': total})
        per_subscription_monthly.append({'id': sub.get('id'), 'name': sub.get('name',''), 'monthly': monthly})

    cumulative = []
    s = 0
    for m in monthly_totals:
        s += m
        cumulative.append(s)

    return jsonify({
        'year': year,
        'monthly_totals': monthly_totals,
        'monthly_counts': monthly_counts,
        'cumulative': cumulative,
        'per_subscription': per_subscription,
        'per_subscription_monthly': per_subscription_monthly,
    })


@app.route('/api/set-override', methods=['POST'])
def api_set_override():
    try:
        data = request.get_json()
        sub_id = int(data.get('subscription_id'))
        year = int(data.get('year'))
        month = int(data.get('month'))
        price_raw = data.get('price')
        # accept string with thousands separators or comma decimals
        if isinstance(price_raw, str):
            cleaned = price_raw.replace('.', '').replace(',', '.')
        else:
            cleaned = str(price_raw)
        price = float(cleaned)
        set_price_override(sub_id, year, month, price)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400


@app.route("/add", methods=["POST"])
def add_subscription():
    name = request.form.get("name")
    # aceptar coma decimal del usuario (ej: 9,99)
    price_raw = request.form.get("price", "0").replace(",", ".")
    price = float(price_raw)
    periodicity = request.form.get("periodicity")
    start_date_s = request.form.get("start_date")
    try:
        start_date = datetime.strptime(start_date_s, "%Y-%m-%d").date()
    except Exception:
        start_date = date.today()
    add_subscription_db(name, price, periodicity, start_date)
    return redirect(url_for("index"))


def _iter_occurrences(sub, year: int):
    # expect sub as dict with 'start_date' as date
    start = sub["start_date"]
    # We'll generate from Jan 1 to Dec 31 of year
    from_date = date(year, 1, 1)
    to_date = date(year, 12, 31)

    # advance to first occurrence >= from_date
    current = start
    if current < from_date:
        # advance in steps until in range
        while current < from_date:
            periodicity = sub["periodicity"]
            if periodicity == "monthly":
                current += relativedelta(months=+1)
            elif periodicity == "quarterly":
                current += relativedelta(months=+3)
            elif periodicity == "semiannual":
                current += relativedelta(months=+6)
            elif periodicity == "annual":
                current += relativedelta(years=+1)
            elif periodicity == "weekly":
                current = current + relativedelta(days=+7)
            else:
                current += relativedelta(months=+1)

    while current <= to_date:
        if current >= from_date:
            yield current
        periodicity = sub["periodicity"]
        if periodicity == "monthly":
            current += relativedelta(months=+1)
        elif periodicity == "quarterly":
            current += relativedelta(months=+3)
        elif periodicity == "semiannual":
            current += relativedelta(months=+6)
        elif periodicity == "annual":
            current += relativedelta(years=+1)
        elif periodicity == "weekly":
            current = current + relativedelta(days=+7)
        else:
            current += relativedelta(months=+1)


@app.route("/download", methods=["GET"])
def download_csv():
    year = int(request.args.get("year", datetime.now().year))
    subs = get_all_subscriptions()

    buf = io.StringIO()
    # Usar ';' como separador para CSV y coma como separador decimal
    writer = csv.writer(buf, delimiter=';')
    writer.writerow(["subscription_name", "date", "price", "periodicity"]) 

    for sub in subs:
        for occ in _iter_occurrences(sub, year):
            price_str = f"{sub.get('price',0):.2f}".replace('.', ',')
            writer.writerow([sub.get('name',''), occ.isoformat(), price_str, sub.get('periodicity','')])

    buf.seek(0)
    mem = io.BytesIO()
    mem.write(buf.getvalue().encode("utf-8"))
    mem.seek(0)
    filename = f"planificacion_{year}.csv"
    return send_file(mem, mimetype="text/csv", download_name=filename, as_attachment=True)


@app.route('/creditos')
def creditos():
    return render_template('creditos.html')


@app.route('/suscripciones', methods=['GET'])
def suscripciones():
    year = request.args.get("year", default=str(datetime.now().year))
    year_int = int(year)
    subscriptions = get_all_subscriptions()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT MIN(date), MAX(date) FROM calendar')
    min_max = cur.fetchone()
    conn.close()
    years = []
    try:
        if min_max and min_max[0] and min_max[1]:
            min_year = datetime.strptime(min_max[0], '%Y-%m-%d').year
            max_year = datetime.strptime(min_max[1], '%Y-%m-%d').year
            years = list(range(min_year, max_year + 1))
    except Exception:
        years = [datetime.now().year]
    monthly_totals = [0.0] * 12
    monthly_counts = [0] * 12
    for sub in subscriptions:
        for occ in _iter_occurrences(sub, year_int):
            monthly_totals[occ.month - 1] += float(sub.get('price', 0))
            monthly_counts[occ.month - 1] += 1
    per_subscription = []
    per_subscription_monthly = []
    for sub in subscriptions:
        monthly = [0.0] * 12
        overrides = get_overrides_for_sub_year(sub.get('id'), year_int)
        for occ in _iter_occurrences(sub, year_int):
            midx = occ.month - 1
            if (occ.month) in overrides:
                monthly[midx] += float(overrides.get(occ.month, sub.get('price', 0)))
            else:
                monthly[midx] += float(sub.get('price', 0))
        total = sum(monthly)
        per_subscription.append({'name': sub.get('name',''), 'total': total})
        per_subscription_monthly.append({'id': sub.get('id'), 'name': sub.get('name',''), 'monthly': monthly, 'total': total})
    cumulative = []
    s = 0.0
    for m in monthly_totals:
        s += m
        cumulative.append(s)
    return render_template("index.html", subscriptions=subscriptions, year=year,
                           monthly_totals=monthly_totals, monthly_counts=monthly_counts,
                           cumulative=cumulative, years=years, per_subscription=per_subscription,
                           per_subscription_monthly=per_subscription_monthly)


if __name__ == "__main__":
    # seed sample data if empty
    if count_subscriptions() == 0:
        sample = [
            {"name":"Crunchy Roll","price":4990.0,"periodicity":"monthly","start_date":date(2026,1,12)},
            {"name":"Google One","price":8990.0,"periodicity":"monthly","start_date":date(2026,1,2)},
            {"name":"Lightroom","price":15000.0,"periodicity":"annual","start_date":date(2026,1,18)},
            {"name":"Spotify Familiar","price":8250.0,"periodicity":"monthly","start_date":date(2026,1,5)},
            {"name":"Youtube","price":11000.0,"periodicity":"monthly","start_date":date(2026,1,1)},
            {"name":"Office 365","price":1490.0,"periodicity":"monthly","start_date":date(2026,1,7)},
        ]
        for s in sample:
            add_subscription_db(s['name'], s['price'], s['periodicity'], s['start_date'])
    app.run(debug=True, port=5001)
