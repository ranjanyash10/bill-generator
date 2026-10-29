from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models import db, CompanySettings, DocumentSettings

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/company', methods=['GET', 'POST'])
@jwt_required()
def manage_company_settings():
    settings = CompanySettings.query.first()
    if not settings:
        settings = CompanySettings()
        db.session.add(settings)
        
    if request.method == 'POST':
        data = request.get_json()
        settings.name = data.get('name', settings.name)
        settings.address = data.get('address', settings.address)
        settings.phone = data.get('phone', settings.phone)
        settings.email = data.get('email', settings.email)
        settings.gstin = data.get('gstin', settings.gstin)
        settings.cin = data.get('cin', settings.cin)
        db.session.commit()
        
    return jsonify({
        'name': settings.name,
        'address': settings.address,
        'phone': settings.phone,
        'email': settings.email,
        'gstin': settings.gstin,
        'cin': settings.cin
    })

@settings_bp.route('/document', methods=['GET', 'POST'])
@jwt_required()
def manage_document_settings():
    settings = DocumentSettings.query.first()
    if not settings:
        settings = DocumentSettings()
        db.session.add(settings)
        
    if request.method == 'POST':
        data = request.get_json()
        settings.receipt_prefix = data.get('receipt_prefix', settings.receipt_prefix)
        settings.bill_prefix = data.get('bill_prefix', settings.bill_prefix)
        settings.numbering_format = data.get('numbering_format', settings.numbering_format)
        db.session.commit()
        
    return jsonify({
        'receipt_prefix': settings.receipt_prefix,
        'bill_prefix': settings.bill_prefix,
        'numbering_format': settings.numbering_format
    })
