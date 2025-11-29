# models/ocr_engine.py - Core OCR Engine adapted from notebook

import os
import json
import base64
import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import re

import numpy as np
from PIL import Image, ImageDraw
from paddleocr import PaddleOCR
from transformers import AutoTokenizer, AutoProcessor, AutoModelForImageTextToText
from openai import OpenAI
import torch

logger = logging.getLogger(__name__)


@dataclass
class OCRConfig:
    """Configuration settings for OCR processing"""
    paddle_model: str = "PP-OCRv5_server_det"
    nanonets_model: str = "nanonets/Nanonets-OCR-s"
    extraction_model: str = "gpt-4o-mini"
    proximity_threshold: int = 30
    row_tolerance: int = 20
    max_ocr_tokens: int = 1500
    max_iterations: int = 100
    output_dir: str = "/tmp/processed"
    enable_cache: bool = True
    batch_size: int = 5
    min_box_size: int = 10
    confidence_threshold: float = 0.5

    def __post_init__(self):
        """Create output directory if it doesn't exist"""
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)


class ModelManager:
    """Manages all OCR models with lazy loading"""
    
    def __init__(self, config: OCRConfig, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self._paddle_model = None
        self._nanonets_model = None
        self._nanonets_processor = None
        self._extraction_client = None
        
    def initialize_paddle(self):
        """Initialize PaddleOCR model"""
        if self._paddle_model is None:
            logger.info("🔄 Loading PaddleOCR model...")
            self._paddle_model = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                det_model_dir=self.config.paddle_model,
                show_log=False
            )
            logger.info("✅ PaddleOCR model loaded")
        return self._paddle_model
    
    def initialize_nanonets(self):
        """Initialize Nanonets OCR model"""
        if self._nanonets_model is None:
            logger.info("🔄 Loading Nanonets model...")
            self._nanonets_processor = AutoProcessor.from_pretrained(
                self.config.nanonets_model
            )
            self._nanonets_model = AutoModelForImageTextToText.from_pretrained(
                self.config.nanonets_model,
                torch_dtype=torch.float16
            )
            
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self._nanonets_model = self._nanonets_model.to(device)
            logger.info(f"✅ Nanonets model loaded on {device}")
        
        return self._nanonets_model, self._nanonets_processor, self._nanonets_model.device
    
    @property
    def extraction_client(self):
        """Initialize OpenAI client for extraction"""
        if self._extraction_client is None and self.api_key:
            logger.info("🔄 Initializing OpenAI client...")
            self._extraction_client = OpenAI(api_key=self.api_key)
            logger.info("✅ OpenAI client initialized")
        return self._extraction_client


class BoundingBoxProcessor:
    """Enhanced bounding box operations"""
    
    @staticmethod
    def polygon_to_bbox(poly: List) -> Tuple[float, float, float, float]:
        """Convert a 4-point polygon into (minX, minY, maxX, maxY)"""
        poly_np = np.array(poly)
        return (
            float(np.min(poly_np[:, 0])),
            float(np.min(poly_np[:, 1])),
            float(np.max(poly_np[:, 0])),
            float(np.max(poly_np[:, 1]))
        )
    
    @staticmethod
    def calculate_box_center(box: Tuple) -> Tuple[float, float]:
        """Calculate the center point of a bounding box"""
        x_min, y_min, x_max, y_max = box
        return ((x_min + x_max) / 2, (y_min + y_max) / 2)
    
    @staticmethod
    def calculate_iou(box1: Tuple, box2: Tuple) -> float:
        """Calculate Intersection over Union (IoU) between two boxes"""
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        x_inter_min = max(x1_min, x2_min)
        y_inter_min = max(y1_min, y2_min)
        x_inter_max = min(x1_max, x2_max)
        y_inter_max = min(y1_max, y2_max)
        
        if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
            return 0.0
        
        intersection = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
        area1 = (x1_max - x1_min) * (y1_max - y1_min)
        area2 = (x2_max - x2_min) * (y2_max - y2_min)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def boxes_should_merge(self, box1: Tuple, box2: Tuple, proximity: int) -> bool:
        """Enhanced merging decision using IoU and proximity"""
        iou = self.calculate_iou(box1, box2)
        if iou > 0.1:
            return True
        
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        overlap_y = y1_max >= y2_min and y2_max >= y1_min
        if overlap_y:
            h_distance = min(abs(x1_min - x2_max), abs(x2_min - x1_max))
            if h_distance <= proximity:
                return True
        
        overlap_x = x1_max >= x2_min and x2_max >= x1_min
        if overlap_x:
            v_distance = min(abs(y1_min - y2_max), abs(y2_min - y1_max))
            if v_distance <= proximity:
                return True
        
        return False
    
    @staticmethod
    def merge_two_boxes(box1: Tuple, box2: Tuple) -> Tuple:
        """Merge two bounding boxes into one"""
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        return (
            min(x1_min, x2_min),
            min(y1_min, y2_min),
            max(x1_max, x2_max),
            max(y1_max, y2_max)
        )
    
    def filter_small_boxes(self, boxes: List, min_size: int = 10) -> List:
        """Remove boxes that are too small"""
        filtered = []
        for box in boxes:
            x_min, y_min, x_max, y_max = box
            width = x_max - x_min
            height = y_max - y_min
            if width >= min_size and height >= min_size:
                filtered.append(box)
        return filtered
    
    def merge_boxes_with_proximity(self, boxes: List, proximity: int, min_size: int = 10) -> List:
        """Enhanced merging with iterative approach"""
        if not boxes:
            return []
        
        boxes = self.filter_small_boxes(boxes, min_size)
        if not boxes:
            return []
        
        boxes = [tuple(map(float, b)) for b in boxes]
        
        merged = True
        iteration = 0
        max_iterations = min(len(boxes) * 2, 50)
        
        while merged and iteration < max_iterations:
            merged = False
            iteration += 1
            new_boxes = []
            used = [False] * len(boxes)
            
            for i in range(len(boxes)):
                if used[i]:
                    continue
                
                current_box = boxes[i]
                
                for j in range(i + 1, len(boxes)):
                    if used[j]:
                        continue
                    
                    if self.boxes_should_merge(current_box, boxes[j], proximity):
                        current_box = self.merge_two_boxes(current_box, boxes[j])
                        used[j] = True
                        merged = True
                
                new_boxes.append(current_box)
                used[i] = True
            
            boxes = new_boxes
        
        logger.info(f"Box merging completed in {iteration} iterations: {len(boxes)} boxes remaining")
        return boxes
    
    def sort_boxes_reading_order(self, boxes: List, row_tolerance: int = 20) -> List:
        """Sort boxes in natural reading order"""
        if not boxes:
            return []
        
        boxes_with_info = []
        for i, box in enumerate(boxes):
            center_x, center_y = self.calculate_box_center(box)
            boxes_with_info.append({
                'box': box,
                'center_x': center_x,
                'center_y': center_y,
                'y_min': box[1],
                'original_index': i
            })
        
        sorted_by_y = sorted(boxes_with_info, key=lambda x: x['y_min'])
        
        rows = []
        if sorted_by_y:
            current_row = [sorted_by_y[0]]
            current_row_y = sorted_by_y[0]['center_y']
            
            for box_info in sorted_by_y[1:]:
                if abs(box_info['center_y'] - current_row_y) <= row_tolerance:
                    current_row.append(box_info)
                    current_row_y = np.mean([b['center_y'] for b in current_row])
                else:
                    rows.append(current_row)
                    current_row = [box_info]
                    current_row_y = box_info['center_y']
            
            if current_row:
                rows.append(current_row)
        
        sorted_boxes = []
        for row in rows:
            row_sorted = sorted(row, key=lambda x: x['center_x'])
            sorted_boxes.extend(row_sorted)
        
        return sorted_boxes


class OCRProcessor:
    """Enhanced OCR text extraction"""
    
    def __init__(self, model_manager: ModelManager, config: OCRConfig):
        self.model_manager = model_manager
        self.config = config
    
    def extract_text_from_slice(self, slice_path: str, retry_count: int = 2) -> str:
        """Extract text from image slice with retry logic"""
        model, processor, device = self.model_manager.initialize_nanonets()
        
        prompt = '''Extract all text from this image slice exactly as it appears.
Follow these rules:
- Preserve the exact text including numbers, symbols, and special characters
- Maintain the original structure and formatting
- For Arabic or other non-English text, preserve it exactly
- If you see amounts or numbers, extract them precisely
- Return ONLY the extracted text without explanations'''
        
        for attempt in range(retry_count + 1):
            try:
                image = Image.open(slice_path).convert("RGB")
                
                messages = [
                    {"role": "system", "content": "You are a precise OCR system."},
                    {"role": "user", "content": [
                        {"type": "image", "image": f"file://{slice_path}"},
                        {"type": "text", "text": prompt},
                    ]},
                ]
                
                text = processor.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
                
                inputs = processor(
                    text=[text],
                    images=[image],
                    padding=True,
                    return_tensors="pt"
                )
                inputs = inputs.to(device)
                
                with torch.no_grad():
                    output_ids = model.generate(
                        **inputs,
                        max_new_tokens=self.config.max_ocr_tokens,
                        do_sample=False,
                        temperature=0.0,
                        num_beams=1
                    )
                
                generated_ids = [
                    output_ids[len(input_ids):]
                    for input_ids, output_ids in zip(inputs.input_ids, output_ids)
                ]
                
                result = processor.batch_decode(
                    generated_ids,
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True
                )[0]
                
                return result.strip()
                
            except Exception as e:
                if attempt < retry_count:
                    logger.warning(f"OCR attempt {attempt + 1} failed, retrying...")
                    continue
                else:
                    logger.error(f"Failed to extract text: {e}")
                    return ""
        
        return ""


class InvoiceDataExtractor:
    """Extracts structured invoice data"""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
    
    def encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    
    def extract_invoice_data(self, image_path: str, extracted_text: str) -> Dict:
        """Extract structured invoice data using AI model"""
        if not self.model_manager.extraction_client:
            logger.warning("Extraction client not initialized")
            return {
                "raw_text": extracted_text,
                "extraction_available": False
            }
        
        base64_image = self.encode_image(image_path)
        
        prompt = f'''Analyze this invoice image and extract ONLY the following essential information into a JSON object.

**Required JSON Structure (use null for missing fields):**
{{
    "invoice_number": "string or null",
    "invoice_date": "string or null",
    "company_name": "string or null",
    "total_amount": {{
        "value": "number or null",
        "currency": "string or null (e.g., USD, EUR, SAR, etc.)"
    }},
    "contact": {{
        "phone": "string or null",
        "email": "string or null"
    }}
}}

**Extraction Guidelines:**
1. **invoice_number**: Look for patterns like "Invoice #", "INV-", "Invoice No.", etc.
2. **invoice_date**: Extract the invoice date (not due date). Format as YYYY-MM-DD if possible.
3. **company_name**: The name of the company issuing the invoice (usually at the top).
4. **total_amount**:
   - Find the FINAL total amount (after taxes and discounts)
   - Extract numeric value only (remove currency symbols)
   - Identify the currency (look for currency codes or symbols)
5. **contact**:
   - phone: Any phone/mobile number found
   - email: Any email address found

**Important Notes:**
- Be precise with the total_amount - this is the most critical field
- Look at the image carefully for visual cues
- If multiple amounts exist, choose the final/grand total
- Use null for any field not clearly visible
- Do not invent or guess values

**OCR Reference Text (use as hint, but verify with image):**
{extracted_text[:1000]}

Return ONLY the JSON object, no explanations.'''
        
        try:
            completion = self.model_manager.extraction_client.chat.completions.create(
                model=self.model_manager.config.extraction_model,
                response_format={"type": "json_object"},
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }],
                temperature=0.0,
                max_tokens=1024
            )
            
            result = json.loads(completion.choices[0].message.content)
            result = self.post_process_data(result)
            result["extraction_available"] = True
            result["raw_text"] = extracted_text
            
            logger.info("✅ Structured data extracted successfully")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return {
                "error": "Invalid JSON response",
                "raw_text": extracted_text,
                "extraction_available": False
            }
        except Exception as e:
            logger.error(f"Error extracting invoice data: {str(e)}")
            return {
                "error": str(e),
                "raw_text": extracted_text,
                "extraction_available": False
            }
    
    def post_process_data(self, data: Dict) -> Dict:
        """Clean and validate extracted data"""
        # Clean phone number
        if data.get("contact", {}).get("phone"):
            phone = data["contact"]["phone"]
            phone = re.sub(r'[^\d+\s\-()]', '', phone)
            data["contact"]["phone"] = phone.strip()
        
        # Clean email
        if data.get("contact", {}).get("email"):
            email = data["contact"]["email"].strip().lower()
            if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
                logger.warning(f"Invalid email format: {email}")
                data["contact"]["email"] = None
            else:
                data["contact"]["email"] = email
        
        # Clean and validate total amount
        if data.get("total_amount") and isinstance(data["total_amount"], dict):
            value = data["total_amount"].get("value")
            if value:
                try:
                    if isinstance(value, str):
                        clean_value = re.sub(r'[^\d.]', '', value)
                        data["total_amount"]["value"] = float(clean_value)
                    else:
                        data["total_amount"]["value"] = float(value)
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert amount to number: {value}")
                    data["total_amount"]["value"] = None
            
            # Normalize currency codes
            currency = data["total_amount"].get("currency")
            if currency:
                currency = currency.upper().strip()
                currency_map = {
                    '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
                    '₹': 'INR', 'SR': 'SAR', 'SAR': 'SAR', 'AED': 'AED',
                    'PKR': 'PKR', 'RS': 'PKR'
                }
                data["total_amount"]["currency"] = currency_map.get(currency, currency)
        
        # Clean invoice date
        if data.get("invoice_date"):
            date_str = data["invoice_date"]
            try:
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                    try:
                        parsed_date = datetime.strptime(date_str, fmt)
                        data["invoice_date"] = parsed_date.strftime('%Y-%m-%d')
                        break
                    except ValueError:
                        continue
            except Exception:
                pass
        
        return data


class InvoiceOCREngine:
    """Main OCR engine"""
    
    def __init__(self, config: OCRConfig, api_key: str = None):
        self.config = config
        self.model_manager = ModelManager(config, api_key)
        self.bbox_processor = BoundingBoxProcessor()
        self.ocr_processor = OCRProcessor(self.model_manager, config)
        self.invoice_extractor = InvoiceDataExtractor(self.model_manager)
    
    def process_document(
        self,
        image_path: str,
        proximity: Optional[int] = None,
        output_dir: Optional[str] = None,
        visualization_path: Optional[str] = None,
        use_extraction: bool = True
    ) -> Dict:
        """Process a document image with OCR"""
        start_time = datetime.now()
        logger.info(f"🔄 Processing document: {Path(image_path).name}")
        
        proximity = proximity or self.config.proximity_threshold
        output_dir = output_dir or self.config.output_dir
        
        try:
            if not Path(image_path).exists():
                raise FileNotFoundError(f"Image not found: {image_path}")
            
            # Step 1: Detect text regions
            logger.info("🔍 Detecting text regions...")
            paddle_model = self.model_manager.initialize_paddle()
            output = paddle_model.ocr(image_path, cls=True)
            
            if not output or not output[0]:
                raise ValueError("No text detected in image")
            
            polygons = [line[0] for line in output[0]]
            logger.info(f"   Found {len(polygons)} text regions")
            
            # Step 2: Convert polygons to bounding boxes
            bboxes = [self.bbox_processor.polygon_to_bbox(poly) for poly in polygons]
            
            # Step 3: Merge nearby boxes
            logger.info("🔗 Merging nearby text boxes...")
            merged_boxes = self.bbox_processor.merge_boxes_with_proximity(
                bboxes,
                proximity,
                min_size=self.config.min_box_size
            )
            
            # Step 4: Sort boxes in reading order
            logger.info("📑 Sorting boxes in reading order...")
            sorted_boxes_info = self.bbox_processor.sort_boxes_reading_order(
                merged_boxes,
                self.config.row_tolerance
            )
            sorted_boxes = [b['box'] for b in sorted_boxes_info]
            logger.info(f"   Processing {len(sorted_boxes)} text regions")
            
            # Step 5: Extract text from each box
            logger.info("📝 Extracting text from regions...")
            os.makedirs(output_dir, exist_ok=True)
            image = Image.open(image_path).convert("RGB")
            extracted_text = ""
            
            for i, box in enumerate(sorted_boxes):
                x1, y1, x2, y2 = map(int, box)
                
                padding = 2
                x1 = max(0, x1 - padding)
                y1 = max(0, y1 - padding)
                x2 = min(image.width, x2 + padding)
                y2 = min(image.height, y2 + padding)
                
                cropped_image = image.crop((x1, y1, x2, y2))
                slice_path = os.path.join(output_dir, f"slice_{i+1:03d}.png")
                cropped_image.save(slice_path, quality=95)
                
                slice_text = self.ocr_processor.extract_text_from_slice(slice_path)
                if slice_text:
                    extracted_text += slice_text + "\n"
                
                if (i + 1) % 10 == 0:
                    logger.info(f"   Processed {i + 1}/{len(sorted_boxes)} regions")
            
            logger.info(f"✅ Text extraction complete ({len(extracted_text)} characters)")
            
            # Step 6: Extract structured data with AI
            invoice_data = {}
            if use_extraction and self.model_manager.extraction_client:
                logger.info("🤖 Extracting structured invoice data...")
                invoice_data = self.invoice_extractor.extract_invoice_data(
                    image_path,
                    extracted_text
                )
            else:
                invoice_data = {
                    "raw_text": extracted_text,
                    "extraction_available": False
                }
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Build result
            result = {
                "invoice_data": invoice_data,
                "raw_text": extracted_text.strip(),
                "bounding_boxes": sorted_boxes,
                "processing_time": processing_time,
                "metadata": {
                    "image_path": image_path,
                    "image_size": f"{image.width}x{image.height}",
                    "num_boxes_detected": len(bboxes),
                    "num_boxes_merged": len(sorted_boxes),
                    "proximity_threshold": proximity,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            logger.info(f"✅ Processing completed in {processing_time:.2f} seconds")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing document: {str(e)}")
            raise
