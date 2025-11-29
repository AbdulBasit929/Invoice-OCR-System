# models/validator.py - Invoice Data Validator

import re
from datetime import datetime
from typing import Dict, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class InvoiceValidator:
    """Enhanced validator with comprehensive checks"""
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """Validate email format"""
        if not email:
            return False, "Email is empty"
        
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w{2,}$'
        if re.match(pattern, email):
            return True, "Valid"
        return False, "Invalid format"
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, str]:
        """Validate phone number"""
        if not phone:
            return False, "Phone is empty"
        
        cleaned = re.sub(r'[^\d]', '', phone)
        if 7 <= len(cleaned) <= 15:
            return True, "Valid"
        return False, f"Invalid length ({len(cleaned)} digits)"
    
    @staticmethod
    def validate_date(date_str: str) -> Tuple[bool, str]:
        """Validate date format"""
        if not date_str:
            return False, "Date is empty"
        
        common_formats = [
            ('%Y-%m-%d', 'YYYY-MM-DD'),
            ('%d/%m/%Y', 'DD/MM/YYYY'),
            ('%m/%d/%Y', 'MM/DD/YYYY'),
            ('%Y/%m/%d', 'YYYY/MM/DD'),
            ('%d-%m-%Y', 'DD-MM-YYYY'),
            ('%m-%d-%Y', 'MM-DD-YYYY')
        ]
        
        for fmt, fmt_name in common_formats:
            try:
                datetime.strptime(date_str, fmt)
                return True, f"Valid ({fmt_name})"
            except ValueError:
                continue
        
        return False, "Unrecognized format"
    
    @staticmethod
    def validate_amount(amount: Any) -> Tuple[bool, str]:
        """Validate amount value"""
        if amount is None:
            return False, "Amount is missing"
        
        try:
            if isinstance(amount, str):
                cleaned = amount.replace(',', '').replace(' ', '')
                value = float(cleaned)
            else:
                value = float(amount)
            
            if value > 0:
                return True, f"Valid ({value:,.2f})"
            return False, "Amount must be positive"
        except (ValueError, TypeError):
            return False, "Cannot convert to number"
    
    @staticmethod
    def validate_invoice_number(inv_num: str) -> Tuple[bool, str]:
        """Validate invoice number"""
        if not inv_num:
            return False, "Invoice number is empty"
        
        if len(inv_num.strip()) >= 3:
            return True, "Valid"
        return False, "Too short"
    
    def validate_invoice_data(self, invoice_data: Dict) -> Dict:
        """Comprehensive validation of all invoice fields"""
        validations = {}
        scores = {
            'critical': 0,  # invoice_number, total_amount
            'important': 0,  # date, company
            'optional': 0   # contact info
        }
        
        max_scores = {
            'critical': 2,
            'important': 2,
            'optional': 2
        }
        
        # Critical fields
        inv_num = invoice_data.get('invoice_number')
        is_valid, message = self.validate_invoice_number(inv_num)
        validations['invoice_number'] = {
            'valid': is_valid,
            'message': message,
            'value': inv_num,
            'field_type': 'critical'
        }
        if is_valid:
            scores['critical'] += 1
        
        # Total Amount
        total = invoice_data.get('total_amount', {})
        if isinstance(total, dict):
            amount = total.get('value')
            currency = total.get('currency')
            is_valid, message = self.validate_amount(amount)
            validations['total_amount'] = {
                'valid': is_valid,
                'message': message,
                'value': amount,
                'currency': currency,
                'field_type': 'critical'
            }
            if is_valid:
                scores['critical'] += 1
        else:
            validations['total_amount'] = {
                'valid': False,
                'message': 'Invalid structure',
                'value': None,
                'field_type': 'critical'
            }
        
        # Important fields
        date_val = invoice_data.get('invoice_date')
        is_valid, message = self.validate_date(date_val)
        validations['invoice_date'] = {
            'valid': is_valid,
            'message': message,
            'value': date_val,
            'field_type': 'important'
        }
        if is_valid:
            scores['important'] += 1
        
        # Company Name
        company = invoice_data.get('company_name')
        is_valid = bool(company and len(company.strip()) > 2)
        validations['company_name'] = {
            'valid': is_valid,
            'message': 'Valid' if is_valid else 'Missing or too short',
            'value': company,
            'field_type': 'important'
        }
        if is_valid:
            scores['important'] += 1
        
        # Optional fields
        contact = invoice_data.get('contact', {})
        
        # Email
        email = contact.get('email')
        is_valid, message = self.validate_email(email)
        validations['email'] = {
            'valid': is_valid,
            'message': message,
            'value': email,
            'field_type': 'optional'
        }
        if is_valid:
            scores['optional'] += 1
        
        # Phone
        phone = contact.get('phone')
        is_valid, message = self.validate_phone(phone)
        validations['phone'] = {
            'valid': is_valid,
            'message': message,
            'value': phone,
            'field_type': 'optional'
        }
        if is_valid:
            scores['optional'] += 1
        
        # Calculate overall quality score
        critical_score = (scores['critical'] / max_scores['critical']) * 50
        important_score = (scores['important'] / max_scores['important']) * 30
        optional_score = (scores['optional'] / max_scores['optional']) * 20
        
        quality_score = critical_score + important_score + optional_score
        
        # Determine grade
        if quality_score >= 90:
            grade = "A"
            grade_description = "Excellent"
        elif quality_score >= 75:
            grade = "B"
            grade_description = "Good"
        elif quality_score >= 60:
            grade = "C"
            grade_description = "Acceptable"
        elif quality_score >= 40:
            grade = "D"
            grade_description = "Poor"
        else:
            grade = "F"
            grade_description = "Failed"
        
        return {
            'validations': validations,
            'scores': scores,
            'max_scores': max_scores,
            'quality_score': round(quality_score, 2),
            'grade': grade,
            'grade_description': grade_description,
            'critical_passed': scores['critical'] == max_scores['critical'],
            'is_usable': quality_score >= 60,
            'confidence_level': 'high' if quality_score >= 80 else 'medium' if quality_score >= 60 else 'low'
        }
