import os
import pandas as pd
import PyPDF2
import pytesseract
from PIL import Image
from typing import Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """
    Handles reading and processing various document formats for AI automation
    """

    def __init__(self):
        self.supported_formats = ['.pdf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png']

    async def process_file(self, file_path: str) -> Dict[str, Any]:
        """
        Main entry point for processing any supported file type

        Args:
            file_path: Path to the file to process

        Returns:
            Dict containing extracted data and metadata
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_extension = Path(file_path).suffix.lower()

        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")

        try:
            if file_extension == '.pdf':
                content = await self.read_pdf(file_path)
                content_type = 'text'
            elif file_extension in ['.xlsx', '.xls', '.csv']:
                content = await self.read_excel(file_path)
                content_type = 'structured'
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                content = await self.read_image(file_path)
                content_type = 'image'

            return {
                'success': True,
                'file_path': file_path,
                'file_name': Path(file_path).name,
                'file_extension': file_extension,
                'content_type': content_type,
                'content': content,
                'file_size': os.path.getsize(file_path)
            }

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
            return {
                'success': False,
                'file_path': file_path,
                'error': str(e)
            }

    async def read_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF using PyPDF2

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text content
        """
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""

                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"

                return text.strip()

        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {str(e)}")
            raise

    async def read_excel(self, file_path: str) -> Dict[str, Any]:
        """
        Read Excel/CSV with pandas

        Args:
            file_path: Path to Excel/CSV file

        Returns:
            Dict containing DataFrame and metadata
        """
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)

            return {
                'data': df.to_dict('records'),
                'columns': list(df.columns),
                'shape': df.shape,
                'dtypes': df.dtypes.to_dict()
            }

        except Exception as e:
            logger.error(f"Error reading Excel/CSV {file_path}: {str(e)}")
            raise

    async def read_image(self, file_path: str) -> str:
        """
        OCR for images using pytesseract

        Args:
            file_path: Path to image file

        Returns:
            Extracted text from image
        """
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text.strip()

        except Exception as e:
            logger.error(f"Error reading image {file_path}: {str(e)}")
            raise
