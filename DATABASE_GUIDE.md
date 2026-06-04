# 🗄️ Database Setup & Alembic Migration Guide

This guide explains how to manage your database schema using Alembic migrations (recommended for production).

## Quick Reference

```powershell
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply all migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Check current migration status
alembic current

# Show migration history
alembic history --verbose
```

## Option 1: Auto-Create Tables (Development)

FastAPI automatically creates tables when you start the app (using `Base.metadata.create_all`).

**Pros:**
- Simple for development
- No migration files to manage
- Good for quick prototyping

**Cons:**
- Tables created on every startup
- Hard to track schema changes
- Not suitable for production

**How to use:**

```powershell
# Terminal 1: Activate venv and start FastAPI
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# FastAPI creates tables automatically
# Check in phpMyAdmin - tables should appear
```

---

## Option 2: Use Alembic Migrations (Recommended)

Alembic is already included in your requirements.txt.

### Setup Initial Migration

**Step 1: Disable auto-create in main.py**

Edit `backend/app/main.py`:

```python
# COMMENT OUT or DELETE this line:
# Base.metadata.create_all(bind=engine)

# Tables will be created by Alembic migrations instead
```

**Step 2: Initialize Alembic (already done)**

```powershell
cd backend

# Check if alembic/ folder exists
ls alembic/

# If not, initialize:
# alembic init alembic
```

**Step 3: Configure Alembic**

Edit `backend/alembic/env.py`:

```python
from backend.app.config import settings
from backend.app.db import Base
from backend.app import models

# Update sqlalchemy.url to use your DATABASE_URL
sqlalchemy_url = settings.DATABASE_URL

# Set target_metadata to your models
target_metadata = Base.metadata
```

**Step 4: Create initial migration**

```powershell
cd backend

# Auto-generate migration from current models
alembic revision --autogenerate -m "Initial schema creation"

# This creates a migration file in alembic/versions/
```

**Step 5: Apply migration**

```powershell
# Check what migrations exist
alembic history

# Apply all migrations
alembic upgrade head

# Verify tables created
# Open phpMyAdmin and check learnbuddy database
```

### Creating New Migrations

When you update your models (e.g., add a new column):

```python
# Example: Add 'subject' column to User model
class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    subject = Column(String)  # NEW COLUMN
```

**Generate migration:**

```powershell
cd backend
alembic revision --autogenerate -m "Add subject to User"
```

**Review the migration file** in `alembic/versions/`:

```python
def upgrade():
    op.add_column('user', sa.Column('subject', sa.String(), nullable=True))

def downgrade():
    op.drop_column('user', 'subject')
```

**Apply the migration:**

```powershell
alembic upgrade head
```

---

## Database Tables Overview

Your models create these tables:

### `user`
```
id          (int, primary key)
email       (string, unique)
password    (string, hashed)
name        (string)
created_at  (datetime)
```

### `user_file`
```
id          (int, primary key)
user_id     (int, foreign key)
filename    (string)
gcs_path    (string)
processed   (boolean)
created_at  (datetime)
```

### `flashcard`
```
id          (int, primary key)
file_id     (int, foreign key)
question    (string)
answer      (string)
created_at  (datetime)
```

### `quiz`
```
id          (int, primary key)
file_id     (int, foreign key)
question    (string)
options     (json)
answer      (string)
created_at  (datetime)
```

### `note`
```
id          (int, primary key)
file_id     (int, foreign key)
content     (text)
created_at  (datetime)
```

---

## Troubleshooting

### Issue: "Relation 'user' does not exist"

**Cause:** Migrations not applied

**Fix:**
```powershell
cd backend
alembic upgrade head
```

### Issue: "Target database is not up to date"

**Fix:**
```powershell
alembic current       # Check current version
alembic upgrade head  # Apply all pending migrations
```

### Issue: Migration files have conflicts

**Fix:**
```powershell
# Merge conflicts manually in alembic/versions/ file
# Or re-create migrations:
alembic downgrade base  # Revert all
alembic upgrade head    # Reapply all
```

### Issue: Need to rollback a migration

```powershell
# Rollback one step
alembic downgrade -1

# Rollback to specific revision
alembic downgrade 1234567890ab
```

---

## Backup & Restore

### Backup your database

```powershell
# Using MySQL command
mysqldump -u root -p learnbuddy > backup_$(Get-Date -Format yyyyMMdd).sql

# Save backup file
```

### Restore from backup

```powershell
mysql -u root -p learnbuddy < backup_20240115.sql
```

---

## Production Best Practices

1. **Version control your migrations**
   ```powershell
   git add alembic/versions/
   git commit -m "Add new schema migration"
   ```

2. **Test migrations locally first**
   ```powershell
   # Create test database
   # Apply migrations
   # Verify it works
   # Then deploy
   ```

3. **Keep migrations small and focused**
   - One feature per migration
   - Easy to rollback if needed

4. **Generate migrations automatically**
   ```powershell
   alembic revision --autogenerate -m "descriptive message"
   ```

5. **Review generated migrations**
   ```powershell
   # Always review the generated .py file before applying
   # Alembic isn't always 100% accurate
   ```

---

## Commands Reference

```powershell
# Current schema version
alembic current

# Full migration history
alembic history

# Detailed history with SQL
alembic history --verbose

# Upgrade to latest version
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# Create new migration (manual)
alembic revision -m "Description of change"

# Create migration from model changes (automatic)
alembic revision --autogenerate -m "Auto-generated message"

# Apply specific migration
alembic upgrade 1234567890ab

# Drop everything and rebuild
alembic downgrade base    # Revert all
alembic upgrade head      # Apply all fresh
```

---

## Integration with CI/CD

If deploying with Docker or CI/CD:

Add to your deployment script:

```bash
#!/bin/bash
cd backend

# Activate venv
source venv/bin/activate

# Apply latest migrations
alembic upgrade head

# Start FastAPI
uvicorn app.main:app
```

---

## Common Model Changes & Migrations

### Add a new column

```python
# In models.py
class User(Base):
    __tablename__ = "user"
    # ... existing columns ...
    phone = Column(String, nullable=True)  # NEW

# Generate migration
alembic revision --autogenerate -m "Add phone to User"
alembic upgrade head
```

### Change column type

```python
# In models.py
class Note(Base):
    __tablename__ = "note"
    content = Column(Text)  # Changed from String

# Generate migration
alembic revision --autogenerate -m "Change Note.content to Text"
alembic upgrade head
```

### Add foreign key

```python
# In models.py
class Comment(Base):
    __tablename__ = "comment"
    note_id = Column(Integer, ForeignKey("note.id"))  # NEW

# Generate migration
alembic revision --autogenerate -m "Add foreign key to Comment"
alembic upgrade head
```

### Create new table

```python
# In models.py
class Category(Base):
    __tablename__ = "category"
    id = Column(Integer, primary_key=True)
    name = Column(String)

# Generate migration
alembic revision --autogenerate -m "Create Category table"
alembic upgrade head
```

---

## Database Inspection

### View all tables

```powershell
# Open phpMyAdmin
http://localhost/phpmyadmin

# Or use MySQL CLI
mysql -u root -p
USE learnbuddy;
SHOW TABLES;
DESCRIBE user;  # View specific table structure
```

### Export database

```powershell
mysqldump -u root -p learnbuddy > export.sql
```

### View current migrations

```powershell
cd backend
alembic current
alembic history
```

---

## ✅ Summary

- **Development:** Use auto-create (simple) or Alembic (recommended)
- **Production:** Always use Alembic for trackable, reversible changes
- **Backup:** Before major changes
- **Test:** Always test migrations locally first
- **Version control:** Commit migration files to git

You're ready to manage your database! 🗄️
