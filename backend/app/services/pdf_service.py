from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import os
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

class PDFService:
    @staticmethod
    def generate_document_pdf(document, company_settings):
        buffer = io.BytesIO()
        
        # A4: 595.27 x 841.89 points
        # Configure doc with 0.5 inch margins for clean spacing
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch
        )
        
        elements = []
        
        # Register Custom Fonts
        font_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts')
        try:
            pdfmetrics.registerFont(TTFont('Montserrat-Bold', os.path.join(font_dir, 'Montserrat-Bold.ttf')))
            pdfmetrics.registerFont(TTFont('Montserrat-Regular', os.path.join(font_dir, 'Montserrat-Regular.ttf')))
            title_font = 'Montserrat-Bold'
            body_font = 'Montserrat-Regular'
        except Exception:
            title_font = 'Helvetica-Bold'
            body_font = 'Helvetica'
            
        styles = getSampleStyleSheet()
        
        # Palette: Elegant Rose & Slate
        PRIMARY_ROSE = colors.HexColor('#9f1239')     # Deep Rose 800
        ACCENT_ROSE = colors.HexColor('#e11d48')      # Rose 600
        LIGHT_ROSE = colors.HexColor('#ffe4e6')       # Rose 100
        BORDER_ROSE = colors.HexColor('#fecdd3')      # Rose 200
        TEXT_DARK = colors.HexColor('#0f172a')        # Slate 900
        TEXT_MUTED = colors.HexColor('#475569')       # Slate 600
        BG_ROW_ALT = colors.HexColor('#fff1f4')       # Soft blush
        
        # Custom Typography Styles
        company_name_style = ParagraphStyle(
            name='CompanyName',
            parent=styles['Normal'],
            fontName=title_font,
            fontSize=18,
            leading=22,
            textColor=PRIMARY_ROSE
        )
        
        company_meta_style = ParagraphStyle(
            name='CompanyMeta',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=8.5,
            leading=12,
            textColor=TEXT_MUTED
        )
        
        doc_type_badge_style = ParagraphStyle(
            name='DocTypeBadge',
            parent=styles['Normal'],
            fontName=title_font,
            fontSize=13,
            leading=16,
            alignment=2,
            textColor=PRIMARY_ROSE
        )
        
        card_text_style = ParagraphStyle(
            name='CardText',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=8.5,
            leading=12,
            textColor=TEXT_DARK
        )
        
        tbl_hdr_style = ParagraphStyle(
            name='TableHdr',
            parent=styles['Normal'],
            fontName=title_font,
            fontSize=9,
            leading=11,
            textColor=PRIMARY_ROSE,
            alignment=0
        )
        
        tbl_hdr_center = ParagraphStyle(
            name='TableHdrCenter',
            parent=tbl_hdr_style,
            alignment=1
        )
        
        tbl_hdr_right = ParagraphStyle(
            name='TableHdrRight',
            parent=tbl_hdr_style,
            alignment=2
        )
        
        tbl_body_style = ParagraphStyle(
            name='TableBody',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=8.5,
            leading=11,
            textColor=TEXT_DARK
        )
        
        tbl_body_center = ParagraphStyle(
            name='TableBodyCenter',
            parent=tbl_body_style,
            alignment=1
        )
        
        tbl_body_right = ParagraphStyle(
            name='TableBodyRight',
            parent=tbl_body_style,
            alignment=2
        )
        
        totals_label_style = ParagraphStyle(
            name='TotalsLabel',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=9,
            leading=12,
            alignment=2,
            textColor=TEXT_MUTED
        )
        
        totals_val_style = ParagraphStyle(
            name='TotalsVal',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=9,
            leading=12,
            alignment=2,
            textColor=TEXT_DARK
        )
        
        grand_total_label = ParagraphStyle(
            name='GrandTotalLabel',
            parent=styles['Normal'],
            fontName=title_font,
            fontSize=11,
            leading=14,
            alignment=2,
            textColor=colors.white
        )
        
        grand_total_val = ParagraphStyle(
            name='GrandTotalVal',
            parent=styles['Normal'],
            fontName=title_font,
            fontSize=12,
            leading=14,
            alignment=2,
            textColor=colors.white
        )
        
        # 1. Header (Company Info on Left, Document Title & Meta on Right)
        comp_name = company_settings.name if company_settings and company_settings.name else "Tenvanta Technologies Pvt Ltd."
        comp_lines = []
        if company_settings and company_settings.address:
            comp_lines.append(company_settings.address.replace('\n', '<br/>'))
        
        contact_parts = []
        if company_settings and company_settings.phone:
            contact_parts.append(f"Phone: {company_settings.phone}")
        if company_settings and company_settings.email:
            contact_parts.append(f"Email: {company_settings.email}")
        if contact_parts:
            comp_lines.append(" | ".join(contact_parts))
            
        tax_parts = []
        if company_settings and company_settings.gstin:
            tax_parts.append(f"<b>GSTIN:</b> {company_settings.gstin}")
        if company_settings and company_settings.cin:
            tax_parts.append(f"<b>CIN:</b> {company_settings.cin}")
        if tax_parts:
            comp_lines.append(" | ".join(tax_parts))
            
        comp_paragraph = Paragraph("<br/>".join(comp_lines), company_meta_style)
        
        doc_title = "TAX INVOICE" if document.doc_type == 'BILL' else "PROFORMA INVOICE"
        if document.status == 'CANCELLED':
            doc_title += " <font color='#dc2626'>(CANCELLED)</font>"
        
        right_header_lines = [
            f"<font size=14 color='{PRIMARY_ROSE.hexval()}'><b>{doc_title}</b></font>",
            f"<font size=9 color='{TEXT_MUTED.hexval()}'>Original for Recipient</font>"
        ]
        right_header_paragraph = Paragraph("<br/>".join(right_header_lines), doc_type_badge_style)
        
        header_table = Table([
            [Paragraph(f"<b>{comp_name}</b>", company_name_style), right_header_paragraph],
            [comp_paragraph, '']
        ], colWidths=[4.6 * inch, 2.65 * inch])
        header_table.setStyle(TableStyle([
            ('SPAN', (1, 0), (1, 1)),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        elements.append(header_table)
        elements.append(Spacer(1, 0.2 * inch))
        
        # 2. Customer & Document Info Card (Framed in soft rose card)
        cust_lines = ["<b>BILLED TO</b>"]
        cust_lines.append(f"<b><font size=10 color='{TEXT_DARK.hexval()}'>{document.customer_name}</font></b>")
        if document.company_name:
            cust_lines.append(document.company_name)
        if document.billing_address:
            formatted_address = document.billing_address.replace('\\n', '<br/>').replace('\n', '<br/>')
            cust_lines.append(formatted_address)
        if document.phone_number:
            cust_lines.append(f"Phone: {document.phone_number}")
        if document.email_address:
            cust_lines.append(f"Email: {document.email_address}")
        if document.gstin:
            cust_lines.append(f"<b>GSTIN:</b> {document.gstin}")
            
        cust_card = Paragraph("<br/>".join(cust_lines), card_text_style)
        
        doc_details_lines = ["<b>INVOICE DETAILS</b>"]
        doc_num = document.document_number or 'DRAFT'
        doc_details_lines.append(f"<b>Invoice No:</b> <font color='{PRIMARY_ROSE.hexval()}'>{doc_num}</font>")
        doc_details_lines.append(f"<b>Date:</b> {document.date.strftime('%d-%b-%Y')}")
        
        if document.doc_type == 'BILL':
            status_color = '#059669' if document.payment_status == 'PAID' else ('#dc2626' if document.payment_status == 'UNPAID' else '#d97706')
            doc_details_lines.append(f"<b>Payment Status:</b> <font color='{status_color}'><b>{document.payment_status}</b></font>")
            if document.payment_mode:
                doc_details_lines.append(f"<b>Payment Mode:</b> {document.payment_mode}")
            if document.transaction_reference:
                doc_details_lines.append(f"<b>Ref / UTR:</b> {document.transaction_reference}")
                
        doc_card = Paragraph("<br/>".join(doc_details_lines), card_text_style)
        
        info_table = Table([
            [cust_card, doc_card]
        ], colWidths=[4.2 * inch, 3.05 * inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_ROSE),
            ('LINEBEFORE', (1, 0), (1, -1), 1, BORDER_ROSE),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.2 * inch))
        
        # 3. Items Table with HSN / SAC column
        col_widths = [0.45 * inch, 2.75 * inch, 0.90 * inch, 0.65 * inch, 1.10 * inch, 1.40 * inch]
        
        table_data = [[
            Paragraph("<b>#</b>", tbl_hdr_center),
            Paragraph("<b>Description / Particulars</b>", tbl_hdr_style),
            Paragraph("<b>HSN / SAC</b>", tbl_hdr_center),
            Paragraph("<b>Qty</b>", tbl_hdr_right),
            Paragraph("<b>Rate (Rs.)</b>", tbl_hdr_right),
            Paragraph("<b>Amount (Rs.)</b>", tbl_hdr_right)
        ]]
        
        for i, item in enumerate(document.items, 1):
            hsn = getattr(item, 'hsn_sac', '') or '-'
            table_data.append([
                Paragraph(str(i), tbl_body_center),
                Paragraph(item.description, tbl_body_style),
                Paragraph(str(hsn), tbl_body_center),
                Paragraph(f"{item.quantity:g}", tbl_body_right),
                Paragraph(f"{item.unit_price:,.2f}", tbl_body_right),
                Paragraph(f"{item.total:,.2f}", tbl_body_right)
            ])
            
        items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        tbl_styles = [
            ('BACKGROUND', (0, 0), (-1, 0), LIGHT_ROSE),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, ACCENT_ROSE),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER_ROSE),
        ]
        
        for row_idx in range(1, len(table_data)):
            bg = colors.white if row_idx % 2 == 1 else BG_ROW_ALT
            tbl_styles.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))
            
        items_table.setStyle(TableStyle(tbl_styles))
        elements.append(items_table)
        elements.append(Spacer(1, 0.15 * inch))
        
        # 4. Totals and Notes Section
        left_notes = []
        if document.notes:
            left_notes.append(f"<b>Notes:</b><br/>{document.notes.replace(chr(10), '<br/>')}")
            
        if company_settings and company_settings.bank_details:
            bank_fmt = company_settings.bank_details.replace('\n', '<br/>')
            left_notes.append(f"<b>Bank & Payment Details:</b><br/>{bank_fmt}")
            
        left_paragraph = Paragraph("<br/><br/>".join(left_notes), card_text_style) if left_notes else Paragraph("", card_text_style)
        
        totals_data = [
            [Paragraph("Subtotal:", totals_label_style), Paragraph(f"Rs. {document.subtotal:,.2f}", totals_val_style)]
        ]
        
        if document.discount > 0:
            totals_data.append([
                Paragraph("Discount:", totals_label_style),
                Paragraph(f"<font color='#dc2626'>-Rs. {document.discount:,.2f}</font>", totals_val_style)
            ])
            
        taxable_value = document.subtotal - document.discount
        if document.tax_amount > 0:
            totals_data.append([
                Paragraph("Taxable Value:", totals_label_style),
                Paragraph(f"Rs. {taxable_value:,.2f}", totals_val_style)
            ])
            tax_label = f"GST / Tax ({document.tax_rate:g}%):"
            totals_data.append([
                Paragraph(tax_label, totals_label_style),
                Paragraph(f"Rs. {document.tax_amount:,.2f}", totals_val_style)
            ])
            
        grand_total_row_idx = len(totals_data)
        totals_data.append([
            Paragraph("Total Amount:", grand_total_label),
            Paragraph(f"Rs. {document.total_amount:,.2f}", grand_total_val)
        ])
        
        if document.doc_type == 'BILL':
            received = document.amount_received or 0.0
            balance = max(0.0, document.total_amount - received)
            totals_data.append([
                Paragraph("Amount Received:", totals_label_style),
                Paragraph(f"Rs. {received:,.2f}", totals_val_style)
            ])
            balance_color = '#dc2626' if balance > 0 else '#059669'
            totals_data.append([
                Paragraph("Balance Due:", totals_label_style),
                Paragraph(f"<font color='{balance_color}'><b>Rs. {balance:,.2f}</b></font>", totals_val_style)
            ])
            
        totals_col_widths = [1.8 * inch, 1.45 * inch]
        totals_table = Table(totals_data, colWidths=totals_col_widths)
        
        tot_styles = [
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('BACKGROUND', (0, grand_total_row_idx), (-1, grand_total_row_idx), PRIMARY_ROSE),
            ('TOPPADDING', (0, grand_total_row_idx), (-1, grand_total_row_idx), 6),
            ('BOTTOMPADDING', (0, grand_total_row_idx), (-1, grand_total_row_idx), 6),
        ]
        
        totals_table.setStyle(TableStyle(tot_styles))
        
        summary_table = Table([
            [left_paragraph, totals_table]
        ], colWidths=[4.0 * inch, 3.25 * inch])
        summary_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(KeepTogether([
            summary_table,
            Spacer(1, 0.3 * inch)
        ]))
        
        # 5. Signatory Block
        sig_text = f"<b>For {comp_name}</b><br/><br/><br/><br/><b>Authorized Signatory</b>"
        sig_paragraph = Paragraph(sig_text, ParagraphStyle(
            name='SigBlock',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=8.5,
            leading=12,
            alignment=2,
            textColor=TEXT_DARK
        ))
        
        terms_text = "<b>Terms & Conditions:</b><br/>1. Goods / Services once sold will not be taken back.<br/>2. Subject to local jurisdiction."
        terms_paragraph = Paragraph(terms_text, ParagraphStyle(
            name='TermsBlock',
            parent=styles['Normal'],
            fontName=body_font,
            fontSize=7.5,
            leading=10,
            textColor=TEXT_MUTED
        ))
        
        footer_block = Table([
            [terms_paragraph, sig_paragraph]
        ], colWidths=[4.5 * inch, 2.75 * inch])
        footer_block.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        elements.append(KeepTogether([footer_block]))
        
        # Canvas callback: Pinkish hue background & framing
        def draw_page_decorations(canvas, d):
            canvas.saveState()
            width, height = d.pagesize
            
            # 1. Warm pinkish / blush hue background fill across entire page
            canvas.setFillColor(colors.HexColor('#fff5f7'))
            canvas.rect(0, 0, width, height, fill=True, stroke=False)
            
            # 2. Top accent banner (Rose 700 + Soft Pink)
            canvas.setFillColor(colors.HexColor('#be123c'))
            canvas.rect(0, height - 7, width, 7, fill=True, stroke=False)
            canvas.setFillColor(colors.HexColor('#fda4af'))
            canvas.rect(0, height - 9, width, 2, fill=True, stroke=False)
            
            # 3. Bottom footer line
            canvas.setFillColor(colors.HexColor('#f43f5e'))
            canvas.rect(0.5 * inch, 26, width - inch, 1.2, fill=True, stroke=False)
            
            # 4. Running Footer Text
            canvas.setFont("Helvetica", 7.5)
            canvas.setFillColor(colors.HexColor('#94a3b8'))
            canvas.drawString(0.5 * inch, 14, "This is a computer-generated invoice | Powered by Tenvanta")
            canvas.drawRightString(width - 0.5 * inch, 14, f"Page {canvas.getPageNumber()}")
            
            canvas.restoreState()
            
        doc.build(elements, onFirstPage=draw_page_decorations, onLaterPages=draw_page_decorations)
        buffer.seek(0)
        return buffer
