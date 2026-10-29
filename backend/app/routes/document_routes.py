from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Document, DocumentItem, User, CompanySettings
from ..services.numbering_service import NumberingService
from ..services.pdf_service import PDFService
from datetime import datetime

doc_bp = Blueprint('documents', __name__)

@doc_bp.route('/', methods=['POST'])
@jwt_required()
def create_document():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Calculate totals
    subtotal = sum(float(item.get('quantity', 1)) * float(item.get('unit_price', 0)) for item in data.get('items', []))
    discount = float(data.get('discount', 0))
    tax_rate = float(data.get('tax_rate', 0))
    taxable_amount = max(0.0, subtotal - discount)
    tax_type = data.get('tax_type', 'INTRA_STATE')

    if tax_type == 'INTER_STATE':
        cgst_rate = 0.0
        cgst_amount = 0.0
        sgst_rate = 0.0
        sgst_amount = 0.0
        igst_rate = tax_rate
        igst_amount = round(taxable_amount * (igst_rate / 100.0), 2)
        tax_amount = igst_amount
    else:
        cgst_rate = tax_rate / 2.0
        sgst_rate = tax_rate / 2.0
        cgst_amount = round(taxable_amount * (cgst_rate / 100.0), 2)
        sgst_amount = round(taxable_amount * (sgst_rate / 100.0), 2)
        igst_rate = 0.0
        igst_amount = 0.0
        tax_amount = cgst_amount + sgst_amount

    total_amount = taxable_amount + tax_amount
    payment_status = data.get('payment_status', 'UNPAID')
    if payment_status == 'PAID':
        amount_received = total_amount
    else:
        raw_received = data.get('amount_received', 0)
        amount_received = float(raw_received) if raw_received != '' and raw_received is not None else 0.0
    
    doc = Document(
        doc_type=data['doc_type'],
        status='DRAFT', # Initially draft
        customer_name=data['customer_name'],
        company_name=data.get('company_name'),
        phone_number=data.get('phone_number'),
        email_address=data.get('email_address'),
        billing_address=data.get('billing_address'),
        gstin=data.get('gstin'),
        subtotal=subtotal,
        discount=discount,
        tax_type=tax_type,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        cgst_rate=cgst_rate,
        cgst_amount=cgst_amount,
        sgst_rate=sgst_rate,
        sgst_amount=sgst_amount,
        igst_rate=igst_rate,
        igst_amount=igst_amount,
        total_amount=total_amount,
        amount_received=amount_received,
        payment_status=data.get('payment_status', 'UNPAID'),
        payment_mode=data.get('payment_mode'),
        transaction_reference=data.get('transaction_reference'),
        notes=data.get('notes'),
        created_by_id=user_id,
        date=datetime.strptime(data.get('date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d')
    )
    
    for item_data in data.get('items', []):
        qty = float(item_data.get('quantity', 1))
        price = float(item_data.get('unit_price', 0))
        item = DocumentItem(
            description=item_data['description'],
            hsn_sac=item_data.get('hsn_sac') or item_data.get('hsn') or '',
            quantity=qty,
            unit_price=price,
            total=qty * price
        )
        doc.items.append(item)
        
    db.session.add(doc)
    db.session.commit()
    
    return jsonify({'id': doc.id, 'status': doc.status}), 201

@doc_bp.route('/<int:doc_id>/issue', methods=['POST'])
@jwt_required()
def issue_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    if doc.status != 'DRAFT':
        return jsonify({'error': 'Only drafts can be issued'}), 400
        
    try:
        doc_number = NumberingService.get_next_number(doc.doc_type, doc.date)
        doc.document_number = doc_number
        doc.status = 'ISSUED'
        db.session.commit()
        return jsonify({'id': doc.id, 'document_number': doc.document_number, 'status': doc.status}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/<int:doc_id>/payment', methods=['PATCH'])
@jwt_required()
def update_payment(doc_id):
    doc = Document.query.get_or_404(doc_id)
    data = request.get_json()
    
    if 'payment_status' in data:
        doc.payment_status = data['payment_status']
    
    if doc.payment_status == 'PAID':
        doc.amount_received = doc.total_amount
    elif doc.payment_status == 'UNPAID':
        doc.amount_received = 0
    else:
        if 'amount_received' in data:
            received = float(data['amount_received'])
            if received >= doc.total_amount:
                doc.payment_status = 'PAID'
                doc.amount_received = doc.total_amount
            elif received <= 0:
                doc.payment_status = 'UNPAID'
                doc.amount_received = 0
            else:
                doc.amount_received = received
            
    db.session.commit()
    return jsonify({
        'id': doc.id, 
        'payment_status': doc.payment_status, 
        'amount_received': doc.amount_received
    }), 200

@doc_bp.route('/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    try:
        db.session.delete(doc)
        db.session.commit()
        return jsonify({'message': 'Document deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@doc_bp.route('/<int:doc_id>', methods=['GET'])
@jwt_required()
def get_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    return jsonify({
        'id': doc.id,
        'document_number': doc.document_number,
        'doc_type': doc.doc_type,
        'status': doc.status,
        'customer_name': doc.customer_name,
        'subtotal': doc.subtotal,
        'discount': doc.discount,
        'tax_type': getattr(doc, 'tax_type', 'INTRA_STATE') or 'INTRA_STATE',
        'tax_rate': doc.tax_rate,
        'tax_amount': doc.tax_amount,
        'cgst_rate': getattr(doc, 'cgst_rate', 0.0) or 0.0,
        'cgst_amount': getattr(doc, 'cgst_amount', 0.0) or 0.0,
        'sgst_rate': getattr(doc, 'sgst_rate', 0.0) or 0.0,
        'sgst_amount': getattr(doc, 'sgst_amount', 0.0) or 0.0,
        'igst_rate': getattr(doc, 'igst_rate', 0.0) or 0.0,
        'igst_amount': getattr(doc, 'igst_amount', 0.0) or 0.0,
        'total_amount': doc.total_amount,
        'amount_received': doc.amount_received,
        'payment_status': doc.payment_status,
        'date': doc.date.strftime('%Y-%m-%d'),
        'items': [{'description': i.description, 'hsn_sac': getattr(i, 'hsn_sac', '') or '', 'quantity': i.quantity, 'unit_price': i.unit_price, 'total': i.total} for i in doc.items]
    })

@doc_bp.route('/<int:doc_id>/pdf', methods=['GET'])
@jwt_required()
def download_pdf(doc_id):
    doc = Document.query.get_or_404(doc_id)
    settings = CompanySettings.query.first()
    
    pdf_buffer = PDFService.generate_document_pdf(doc, settings)
    
    filename = f"{doc.document_number or 'DRAFT'}.pdf"
    
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )

@doc_bp.route('/', methods=['GET'])
@jwt_required()
def list_documents():
    docs = Document.query.order_by(Document.created_at.desc()).all()
    return jsonify([{
        'id': d.id,
        'document_number': d.document_number,
        'customer_name': d.customer_name,
        'date': d.date.strftime('%Y-%m-%d'),
        'doc_type': d.doc_type,
        'total_amount': d.total_amount,
        'status': d.status,
        'payment_status': d.payment_status,
        'amount_received': d.amount_received
    } for d in docs])

@doc_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    docs = Document.query.all()
    total_docs = len(docs)
    receipts_issued = len([d for d in docs if d.doc_type == 'RECEIPT' and d.status == 'ISSUED'])
    bills_issued = len([d for d in docs if d.doc_type == 'BILL' and d.status == 'ISSUED'])
    
    total_received = sum((d.total_amount if d.payment_status == 'PAID' else d.amount_received) for d in docs if d.status != 'CANCELLED')
    total_billed = sum(d.total_amount for d in docs if d.doc_type == 'BILL' and d.status != 'CANCELLED')
    outstanding = total_billed - sum((d.total_amount if d.payment_status == 'PAID' else d.amount_received) for d in docs if d.doc_type == 'BILL' and d.status != 'CANCELLED')
    
    recent = Document.query.order_by(Document.created_at.desc()).limit(5).all()
    
    return jsonify({
        'total_documents': total_docs,
        'receipts_issued': receipts_issued,
        'bills_issued': bills_issued,
        'total_received': total_received,
        'outstanding_amount': outstanding,
        'recent_documents': [{
            'id': d.id,
            'document_number': d.document_number,
            'customer_name': d.customer_name,
            'date': d.date.strftime('%Y-%m-%d'),
            'doc_type': d.doc_type,
            'total_amount': d.total_amount,
            'status': d.status,
            'payment_status': d.payment_status,
            'amount_received': d.amount_received
        } for d in recent]
    })

