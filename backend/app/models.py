from . import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='EMPLOYEE') # ADMIN or EMPLOYEE

class CompanySettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), default="Tenvanta Technologies Pvt Ltd.")
    logo_path = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    gstin = db.Column(db.String(50), nullable=True)
    cin = db.Column(db.String(50), nullable=True)
    bank_details = db.Column(db.Text, nullable=True)
    default_currency = db.Column(db.String(10), default="₹")

class DocumentSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    receipt_prefix = db.Column(db.String(20), default="PI")
    bill_prefix = db.Column(db.String(20), default="TI")
    numbering_format = db.Column(db.String(50), default="{year}_{prefix}{sequence}")
    financial_year_start_month = db.Column(db.Integer, default=4)
    default_notes = db.Column(db.Text, nullable=True)
    default_terms = db.Column(db.Text, nullable=True)
    signature_label = db.Column(db.String(100), default="Authorized Signatory")
    pdf_footer = db.Column(db.Text, nullable=True)

class DocumentSequence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doc_type = db.Column(db.String(20), nullable=False) # 'RECEIPT' or 'BILL'
    year = db.Column(db.String(10), nullable=False)
    next_sequence = db.Column(db.Integer, default=1)

    __table_args__ = (db.UniqueConstraint('doc_type', 'year', name='uix_doctype_year'),)

class CustomField(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(100), nullable=False)
    field_type = db.Column(db.String(50), nullable=False) # short_text, long_text, number, date, dropdown, checkbox
    required = db.Column(db.Boolean, default=False)
    default_value = db.Column(db.String(255), nullable=True)
    show_on_pdf = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_number = db.Column(db.String(50), unique=True, nullable=True) # Null for drafts
    doc_type = db.Column(db.String(20), nullable=False) # 'RECEIPT' or 'BILL'
    status = db.Column(db.String(20), default='DRAFT') # DRAFT, ISSUED, CANCELLED
    payment_status = db.Column(db.String(20), default='UNPAID') # UNPAID, PARTIAL, PAID
    
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    
    customer_name = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255), nullable=True)
    phone_number = db.Column(db.String(50), nullable=True)
    email_address = db.Column(db.String(255), nullable=True)
    billing_address = db.Column(db.Text, nullable=True)
    gstin = db.Column(db.String(50), nullable=True)
    
    subtotal = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0)
    tax_rate = db.Column(db.Float, default=0.0)
    tax_amount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)
    amount_received = db.Column(db.Float, default=0.0)
    
    payment_mode = db.Column(db.String(50), nullable=True)
    transaction_reference = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    items = db.relationship('DocumentItem', backref='document', lazy=True, cascade="all, delete-orphan")
    custom_fields = db.relationship('DocumentCustomField', backref='document', lazy=True, cascade="all, delete-orphan")

class DocumentItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Float, default=1.0)
    unit_price = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, default=0.0)

class DocumentCustomField(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'), nullable=False)
    custom_field_id = db.Column(db.Integer, db.ForeignKey('custom_field.id'), nullable=False)
    value = db.Column(db.Text, nullable=True)

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(255), nullable=False)
    document_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
