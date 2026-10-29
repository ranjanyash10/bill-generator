from ..models import db, DocumentSequence, DocumentSettings
from sqlalchemy.exc import IntegrityError
from datetime import datetime

class NumberingService:
    @staticmethod
    def _get_financial_year_string(date, start_month):
        if date.month >= start_month:
            return f"{date.year}-{date.year + 1}"
        else:
            return f"{date.year - 1}-{date.year}"

    @staticmethod
    def get_next_number(doc_type, date_obj):
        """
        Safely generate the next document number atomically.
        """
        settings = DocumentSettings.query.first()
        if not settings:
            settings = DocumentSettings()
            db.session.add(settings)
            db.session.commit()
            
        prefix = settings.receipt_prefix if doc_type == 'RECEIPT' else settings.bill_prefix
        
        # Determine year string based on format
        # Using simple calendar year
        year_str = str(date_obj.year)
        
        # Use a retry loop for SQLite concurrency
        max_retries = 3
        for _ in range(max_retries):
            try:
                # Find or create sequence
                seq = DocumentSequence.query.filter_by(doc_type=doc_type, year=year_str).first()
                if not seq:
                    seq = DocumentSequence(doc_type=doc_type, year=year_str, next_sequence=1)
                    db.session.add(seq)
                    db.session.commit()
                
                # Increment sequence
                current_seq = seq.next_sequence
                seq.next_sequence = current_seq + 1
                db.session.commit()
                
                # Format document number
                # Format like PREFIX-YEAR-SEQUENCE
                sequence_str = str(current_seq).zfill(5)
                
                format_str = settings.numbering_format
                doc_number = format_str.replace("{prefix}", prefix).replace("{year}", year_str).replace("{sequence}", sequence_str)
                
                return doc_number
                
            except IntegrityError:
                db.session.rollback()
                continue
            except Exception as e:
                db.session.rollback()
                raise e
                
        raise Exception("Failed to generate document number due to concurrency issues")
