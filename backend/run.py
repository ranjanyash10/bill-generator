from app import create_app, db, bcrypt
from app.models import User, CompanySettings, DocumentSettings

app = create_app()

def init_db():
    with app.app_context():
        db.create_all()
        # Create admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            hashed = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin = User(username='admin', password_hash=hashed, role='ADMIN')
            db.session.add(admin)
            
        # Create default settings if not exist
        if not CompanySettings.query.first():
            db.session.add(CompanySettings())
        if not DocumentSettings.query.first():
            db.session.add(DocumentSettings())
            
        db.session.commit()

        # Migrate existing document and document_item table schema if needed
        try:
            with db.engine.connect() as conn:
                dialect = db.engine.dialect.name
                if dialect == 'postgresql':
                    conn.execute(db.text("ALTER TABLE document_item ADD COLUMN IF NOT EXISTS hsn_sac VARCHAR(50);"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT 'INTRA_STATE';"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS cgst_rate FLOAT DEFAULT 0.0;"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS cgst_amount FLOAT DEFAULT 0.0;"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS sgst_rate FLOAT DEFAULT 0.0;"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS sgst_amount FLOAT DEFAULT 0.0;"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS igst_rate FLOAT DEFAULT 0.0;"))
                    conn.execute(db.text("ALTER TABLE document ADD COLUMN IF NOT EXISTS igst_amount FLOAT DEFAULT 0.0;"))
                    conn.commit()
                elif dialect == 'sqlite':
                    for col_sql in [
                        "ALTER TABLE document_item ADD COLUMN hsn_sac VARCHAR(50);",
                        "ALTER TABLE document ADD COLUMN tax_type VARCHAR(20) DEFAULT 'INTRA_STATE';",
                        "ALTER TABLE document ADD COLUMN cgst_rate FLOAT DEFAULT 0.0;",
                        "ALTER TABLE document ADD COLUMN cgst_amount FLOAT DEFAULT 0.0;",
                        "ALTER TABLE document ADD COLUMN sgst_rate FLOAT DEFAULT 0.0;",
                        "ALTER TABLE document ADD COLUMN sgst_amount FLOAT DEFAULT 0.0;",
                        "ALTER TABLE document ADD COLUMN igst_rate FLOAT DEFAULT 0.0;",
                        "ALTER TABLE document ADD COLUMN igst_amount FLOAT DEFAULT 0.0;"
                    ]:
                        try:
                            conn.execute(db.text(col_sql))
                            conn.commit()
                        except Exception:
                            pass
        except Exception as mig_err:
            print(f"Migration note: {mig_err}")

# Initialize DB tables and seed data if needed
try:
    init_db()
except Exception as e:
    print(f"Database initialization notice: {e}")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
