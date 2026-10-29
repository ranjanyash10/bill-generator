from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfgen import canvas
import io
import os
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

class PDFService:
    @staticmethod
    def generate_document_pdf(document, company_settings):
        buffer = io.BytesIO()
        
        # Configure doc
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        elements = []
        
        # Register Custom Fonts
        font_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts')
        try:
            pdfmetrics.registerFont(TTFont('Montserrat-Bold', os.path.join(font_dir, 'Montserrat-Bold.ttf')))
            pdfmetrics.registerFont(TTFont('Montserrat-Regular', os.path.join(font_dir, 'Montserrat-Regular.ttf')))
            title_font = 'Montserrat-Bold'
        except Exception:
            # Fallback if font missing
            title_font = 'Helvetica-Bold'
            
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontName=title_font,
            fontSize=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=15
        )
        
        doc_title_style = ParagraphStyle(
            name='DocTitle', 
            parent=styles['Heading2'], 
            alignment=1, 
            fontSize=16,
            fontName=title_font,
            textColor=colors.HexColor('#334155'),
            spaceAfter=5
        )
        
        normal_style = styles['Normal']
        
        # Company Header
        company_name = company_settings.name if company_settings else "Tenvanta Technologies Pvt Ltd."
        elements.append(Paragraph(f"<b>{company_name}</b>", title_style))
        
        if company_settings and company_settings.address:
            elements.append(Paragraph(company_settings.address.replace('\n', '<br/>'), normal_style))
        
        if company_settings and company_settings.gstin:
            elements.append(Paragraph(f"GSTIN: {company_settings.gstin}", normal_style))
            
        elements.append(Spacer(1, 0.5*inch))
        
        # Document Title and Info
        doc_title = "TAX INVOICE" if document.doc_type == 'BILL' else "PROFORMA INVOICE"
        if document.status == 'CANCELLED':
            doc_title += " (CANCELLED)"
        
        elements.append(Paragraph(f"{doc_title}", doc_title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Two column layout for Doc Info and Customer Info
        doc_info = f"""
        <b>Document No:</b> {document.document_number or 'DRAFT'}<br/>
        <b>Date:</b> {document.date.strftime('%d-%b-%Y')}<br/>
        """
        if document.doc_type == 'BILL':
            doc_info += f"<b>Payment Status:</b> {document.payment_status}"
        
        customer_info = f"""
        <b>Billed To:</b><br/>
        {document.customer_name}<br/>
        """
        if document.company_name:
            customer_info += f"{document.company_name}<br/>"
        if document.billing_address:
            formatted_address = document.billing_address.replace('\\n', '<br/>')
            customer_info += f"{formatted_address}<br/>"
        if document.gstin:
            customer_info += f"GSTIN: {document.gstin}"
            
        info_table = Table([
            [Paragraph(customer_info, normal_style), Paragraph(doc_info, normal_style)]
        ], colWidths=[3.2*inch, 3.2*inch])
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Items Table
        table_data = [['S.No', 'Description', 'Qty', 'Unit Price', 'Total']]
        for i, item in enumerate(document.items, 1):
            table_data.append([
                str(i),
                Paragraph(item.description, normal_style),
                str(item.quantity),
                f"Rs. {item.unit_price:.2f}",
                f"Rs. {item.total:.2f}"
            ])
            
        items_table = Table(table_data, colWidths=[0.5*inch, 3*inch, 0.7*inch, 1.1*inch, 1.1*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        
        elements.append(items_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Totals
        totals_data = [
            ['Subtotal:', f"Rs. {document.subtotal:.2f}"]
        ]
        
        if document.discount > 0:
            totals_data.append(['Discount:', f"Rs. {document.discount:.2f}"])
            
        if document.tax_amount > 0:
            totals_data.append([f'Tax ({document.tax_rate}%):', f"Rs. {document.tax_amount:.2f}"])
            
        totals_data.extend([
            ['Total Amount:', f"Rs. {document.total_amount:.2f}"]
        ])
        
        if document.doc_type == 'BILL':
            totals_data.append(['Amount Received:', f"Rs. {document.amount_received:.2f}"])
        
        totals_table = Table(totals_data, colWidths=[4.9*inch, 1.5*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,-1), 'RIGHT'),
            ('ALIGN', (1,0), (1,-1), 'RIGHT'),
            ('FONTNAME', (0,-2), (1,-2), 'Helvetica-Bold'),
        ]))
        
        elements.append(totals_table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Notes and Signatures
        if document.notes:
            elements.append(Paragraph("<b>Notes:</b>", normal_style))
            elements.append(Paragraph(document.notes.replace('\n', '<br/>'), normal_style))
            elements.append(Spacer(1, 0.5*inch))
            
        signature_data = [
            ['', 'For Tenvanta Technologies Pvt Ltd.'],
            ['', ''],
            ['', ''],
            ['', 'Authorized Signatory']
        ]
        
        sig_table = Table(signature_data, colWidths=[3.5*inch, 2.9*inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ]))
        
        elements.append(sig_table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
