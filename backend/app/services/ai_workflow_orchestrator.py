import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.document_processor import DocumentProcessor
from app.services.qwen_service import QwenService
from app.services.accounting_service import AccountingService
from app.core.exceptions import ValidationError
from app.schemas.accounting import TransactionCreate

logger = logging.getLogger(__name__)

class AIWorkflowOrchestrator:
    """
    Orchestrates complete AI automation workflow:
    File Upload → Extract → Save → Categorize → Validate → Analyze → Recommend
    """

    def __init__(self):
        self.document_processor = DocumentProcessor()
        self.qwen_service = QwenService()
        self.accounting_service = AccountingService()

    async def process_document_complete(self, file_path: str, user_id: int) -> Dict[str, Any]:
        """
        Main workflow orchestrator

        Steps:
        1. Read file (PDF/Excel/Image)
        2. Extract transactions with Qwen OCR + parsing
        3. Auto-save transactions to database
        4. Auto-categorize each transaction with Qwen
        5. Validate transactions (check completeness, anomalies)
        6. Analyze spending patterns with Qwen
        7. Generate AI recommendations

        Args:
            file_path: Path to uploaded file
            user_id: User ID for database operations

        Returns:
            Dict with complete workflow results
        """
        workflow_results = {
            "success": False,
            "extracted_count": 0,
            "transactions": [],
            "validation": {},
            "patterns": {},
            "recommendations": [],
            "errors": [],
            "processing_time": 0
        }

        start_time = datetime.now()

        try:
            logger.info(f"Starting AI workflow for file: {file_path}, user: {user_id}")

            # Step 1: Read and process file
            logger.info("Step 1: Reading document")
            file_data = await self.document_processor.process_file(file_path)

            if not file_data['success']:
                raise Exception(f"Failed to process file: {file_data.get('error', 'Unknown error')}")

            # Step 2: Extract invoice/transaction data with Qwen
            logger.info("Step 2: Extracting data with Qwen AI")
            extracted_data = await self._extract_transaction_data(file_data)

            if not extracted_data:
                raise Exception("No transaction data could be extracted from the file")

            workflow_results["extracted_count"] = len(extracted_data)

            # Step 3: Save transactions to database
            logger.info("Step 3: Saving transactions to database")
            saved_transactions = await self._save_transactions(extracted_data, user_id)
            workflow_results["transactions"] = saved_transactions

            # Step 4: Auto-categorize transactions
            logger.info("Step 4: Auto-categorizing transactions")
            categorized_transactions = await self._categorize_transactions(saved_transactions)
            workflow_results["transactions"] = categorized_transactions

            # Step 5: Validate transactions
            logger.info("Step 5: Validating transactions")
            validation_results = await self._validate_transactions(categorized_transactions)
            workflow_results["validation"] = validation_results

            # Step 6: Analyze spending patterns
            logger.info("Step 6: Analyzing spending patterns")
            pattern_analysis = await self._analyze_patterns(categorized_transactions)
            workflow_results["patterns"] = pattern_analysis

            # Step 7: Generate AI recommendations
            logger.info("Step 7: Generating AI recommendations")
            recommendations = await self._generate_recommendations(categorized_transactions, pattern_analysis)
            workflow_results["recommendations"] = recommendations

            workflow_results["success"] = True
            logger.info("AI workflow completed successfully")

        except Exception as e:
            error_msg = f"Workflow failed: {str(e)}"
            logger.error(error_msg)
            workflow_results["errors"].append(error_msg)

        finally:
            # Calculate processing time
            end_time = datetime.now()
            workflow_results["processing_time"] = (end_time - start_time).total_seconds()

            logger.info(f"Workflow completed in {workflow_results['processing_time']:.2f} seconds")

        return workflow_results

    async def _extract_transaction_data(self, file_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract transaction data from processed file using Qwen

        Args:
            file_data: Processed file data from DocumentProcessor

        Returns:
            List of extracted transaction dicts
        """
        try:
            content = file_data['content']
            content_type = file_data['content_type']

            if content_type == 'structured':
                # For Excel/CSV, process structured data
                return await self._process_structured_data(content)
            else:
                # For text or image, use Qwen extraction
                extracted = await self.qwen_service.extract_invoice_data(content, content_type)

                # Convert single invoice to transaction format
                transactions = []

                if extracted.get('items'):
                    for item in extracted['items']:
                        transaction = {
                            'date': extracted.get('date', datetime.now().strftime('%Y-%m-%d')),
                            'description': item.get('description', extracted.get('vendor', 'Unknown')),
                            'amount': item.get('total', 0),
                            'category': extracted.get('suggested_category', 'Other'),
                            'type': 'expense',
                            'vendor': extracted.get('vendor'),
                            'invoice_number': extracted.get('invoice_number'),
                            'currency': extracted.get('currency', 'USD'),
                            'payment_method': extracted.get('payment_method')
                        }
                        transactions.append(transaction)
                else:
                    # Single transaction
                    transaction = {
                        'date': extracted.get('date', datetime.now().strftime('%Y-%m-%d')),
                        'description': extracted.get('vendor', 'Unknown transaction'),
                        'amount': extracted.get('total', 0),
                        'category': extracted.get('suggested_category', 'Other'),
                        'type': 'expense',
                        'vendor': extracted.get('vendor'),
                        'invoice_number': extracted.get('invoice_number'),
                        'currency': extracted.get('currency', 'USD'),
                        'payment_method': extracted.get('payment_method')
                    }
                    transactions.append(transaction)

                return transactions

        except Exception as e:
            logger.error(f"Transaction extraction failed: {str(e)}")
            return []

    async def _process_structured_data(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process structured Excel/CSV data into transactions

        Args:
            data: Structured data from DocumentProcessor

        Returns:
            List of transaction dicts
        """
        transactions = []

        try:
            records = data.get('data', [])

            for record in records:
                # Try to map common column names to transaction fields
                transaction = {
                    'date': record.get('date') or record.get('Date') or datetime.now().strftime('%Y-%m-%d'),
                    'description': record.get('description') or record.get('Description') or record.get('item') or 'Unknown',
                    'amount': float(record.get('amount') or record.get('Amount') or record.get('total') or 0),
                    'category': record.get('category') or record.get('Category') or 'Other',
                    'type': record.get('type') or record.get('Type') or 'expense',
                    'vendor': record.get('vendor') or record.get('Vendor'),
                    'currency': record.get('currency') or record.get('Currency') or 'USD'
                }
                transactions.append(transaction)

        except Exception as e:
            logger.error(f"Structured data processing failed: {str(e)}")

        return transactions

    async def _save_transactions(self, transactions: List[Dict[str, Any]], user_id: int) -> List[Dict[str, Any]]:
        """
        Save transactions to database

        Args:
            transactions: List of transaction dicts
            user_id: User ID

        Returns:
            List of saved transaction dicts with IDs
        """
        saved_transactions = []

        try:
            for transaction_data in transactions:
                # Convert to TransactionCreate schema
                transaction_create = TransactionCreate(
                    user_id=user_id,
                    date=datetime.fromisoformat(transaction_data['date']) if isinstance(transaction_data['date'], str) else transaction_data['date'],
                    description=transaction_data['description'],
                    amount=transaction_data['amount'],
                    category=transaction_data['category'],
                    type=transaction_data['type']
                )

                # Save to database
                saved_transaction = await self.accounting_service.create_transaction(transaction_create)

                # Add additional metadata
                transaction_dict = saved_transaction.__dict__ if hasattr(saved_transaction, '__dict__') else dict(saved_transaction)
                transaction_dict.update({
                    'vendor': transaction_data.get('vendor'),
                    'invoice_number': transaction_data.get('invoice_number'),
                    'currency': transaction_data.get('currency', 'USD'),
                    'payment_method': transaction_data.get('payment_method')
                })

                saved_transactions.append(transaction_dict)

        except Exception as e:
            logger.error(f"Transaction saving failed: {str(e)}")
            raise

        return saved_transactions

    async def _categorize_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Auto-categorize transactions using Qwen

        Args:
            transactions: List of transaction dicts

        Returns:
            List of transactions with updated categories
        """
        categorized_transactions = []

        try:
            for transaction in transactions:
                # Skip if already has a good category
                if transaction.get('category') and transaction['category'] != 'Other':
                    categorized_transactions.append(transaction)
                    continue

                # Use Qwen for categorization
                categorization = await self.qwen_service.categorize_transaction(
                    transaction['description'],
                    transaction['amount']
                )

                # Update transaction category
                updated_transaction = transaction.copy()
                updated_transaction['category'] = categorization.get('category', 'Other')
                updated_transaction['category_confidence'] = categorization.get('confidence', 0.0)
                updated_transaction['category_reasoning'] = categorization.get('reasoning', '')

                categorized_transactions.append(updated_transaction)

                # Small delay to avoid rate limiting
                await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Transaction categorization failed: {str(e)}")
            # Return original transactions if categorization fails
            return transactions

        return categorized_transactions

    async def _validate_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate transactions for completeness and anomalies

        Args:
            transactions: List of transaction dicts

        Returns:
            Validation results dict
        """
        validation_results = {
            'total_transactions': len(transactions),
            'valid_transactions': 0,
            'invalid_transactions': 0,
            'issues': [],
            'completeness_score': 0.0
        }

        try:
            valid_count = 0
            issues = []

            for i, transaction in enumerate(transactions):
                transaction_issues = []

                # Check required fields
                if not transaction.get('description'):
                    transaction_issues.append('Missing description')

                if transaction.get('amount', 0) <= 0:
                    transaction_issues.append('Invalid or zero amount')

                if not transaction.get('date'):
                    transaction_issues.append('Missing date')

                # Check for reasonable amounts (basic anomaly detection)
                amount = transaction.get('amount', 0)
                if amount > 100000:  # Very large transaction
                    transaction_issues.append('Unusually large amount')

                if transaction_issues:
                    issues.append({
                        'transaction_index': i,
                        'transaction_id': transaction.get('id'),
                        'issues': transaction_issues
                    })
                else:
                    valid_count += 1

            validation_results['valid_transactions'] = valid_count
            validation_results['invalid_transactions'] = len(issues)
            validation_results['issues'] = issues
            validation_results['completeness_score'] = valid_count / len(transactions) if transactions else 0.0

        except Exception as e:
            logger.error(f"Transaction validation failed: {str(e)}")
            validation_results['error'] = str(e)

        return validation_results

    async def _analyze_patterns(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze spending patterns using Qwen

        Args:
            transactions: List of transaction dicts

        Returns:
            Pattern analysis results
        """
        try:
            # Get user's recent transactions for context (not just the uploaded ones)
            # For now, analyze just the uploaded transactions
            pattern_analysis = await self.qwen_service.analyze_spending_patterns(transactions)
            return pattern_analysis

        except Exception as e:
            logger.error(f"Pattern analysis failed: {str(e)}")
            return {
                'spending_trends': [],
                'anomalies': [],
                'insights': [],
                'seasonal_patterns': {},
                'error': str(e)
            }

    async def _generate_recommendations(self, transactions: List[Dict[str, Any]], patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate AI recommendations

        Args:
            transactions: List of transaction dicts
            patterns: Pattern analysis results

        Returns:
            List of recommendation dicts
        """
        try:
            recommendations = await self.qwen_service.generate_recommendations(transactions, patterns)
            return recommendations

        except Exception as e:
            logger.error(f"Recommendation generation failed: {str(e)}")
            return [
                {
                    'title': 'AI Recommendation System Error',
                    'description': f'Unable to generate recommendations: {str(e)}',
                    'category': 'System',
                    'impact': 'Unknown',
                    'estimated_savings': '$0',
                    'implementation_steps': ['Contact support'],
                    'priority': 1
                }
            ]
