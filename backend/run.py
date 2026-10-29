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

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
