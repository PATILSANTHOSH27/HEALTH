import sqlite3

# create database
conn = sqlite3.connect("users.db")

cursor = conn.cursor()

# create users table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL

)
""")

print("Database created successfully!")

conn.commit()
conn.close()
