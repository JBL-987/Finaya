from typing import Callable, Type, Any, Optional
from functools import lru_cache
from contextlib import asynccontextmanager
import logging

from .database import Database
from .config import settings
from ..repositories.base_repository import BaseRepository
from ..repositories.analysis_repository import AnalysisRepository
from ..repositories.accounting_repository import AccountingRepository
from ..repositories.advisor import AdvisorRepository
from ..repositories.document_repository import DocumentRepository
from ..repositories.user_repository import UserRepository
from ..services.analysis_service import AnalysisService
from ..services.accounting_service import AccountingService
from ..services.advisor_service import AdvisorService
from ..services.document_service import DocumentService
from ..services.user_service import UserService

logger = logging.getLogger(__name__)

class DependencyContainer:
    """Dependency injection container for managing service instances and lifecycle"""

    def __init__(self):
        self._database: Optional[Database] = None
        self._repositories: dict[str, Any] = {}
        self._services: dict[str, Any] = {}
        self._singletons: dict[str, Any] = {}
        self._initialized = False

    async def initialize(self):
        """Initialize the container and database connection"""
        if self._initialized:
            return

        logger.info("🏗️ Initializing dependency container...")

        try:
            # Initialize database
            self._database = Database()
            await self._database.initialize()
            logger.info("✅ Database initialized")

            # Pre-initialize commonly used repositories
            await self._get_or_create_repository(AnalysisRepository, 'analysis_repository')
            await self._get_or_create_repository(AccountingRepository, 'accounting_repository')
            await self._get_or_create_repository(AdvisorRepository, 'advisor_repository')
            await self._get_or_create_repository(DocumentRepository, 'document_repository')
            await self._get_or_create_repository(UserRepository, 'user_repository')

            logger.info("✅ Dependency container initialized")
            self._initialized = True

        except Exception as e:
            logger.error(f"❌ Failed to initialize dependency container: {e}")
            raise

    async def close(self):
        """Clean up resources"""
        if self._database:
            await self._database.close()

        # Clear instances
        self._repositories.clear()
        self._services.clear()
        self._singletons.clear()
        self._initialized = False
        logger.info("🧹 Dependency container cleaned up")

    @property
    def database(self) -> Database:
        """Get database instance"""
        if not self._database:
            raise RuntimeError("Container not initialized")
        return self._database

    async def _get_or_create_repository(self, repo_class: Type[BaseRepository], key: str):
        """Create repository instance with database dependency"""
        if key in self._repositories:
            return self._repositories[key]

        repo = repo_class()
        self._repositories[key] = repo
        return repo

    async def _get_or_create_service(self, service_class: Type, repo_key: str, service_key: str):
        """Create service instance with repository dependency"""
        if service_key in self._services:
            return self._services[service_key]

        repo = await self._get_or_create_repository_from_key(repo_key)
        service = service_class(repository=repo)
        self._services[service_key] = service
        return service

    async def _get_or_create_repository_from_key(self, key: str):
        """Helper to get repository by string key"""
        if key == 'analysis_repository':
            return await self._get_or_create_repository(AnalysisRepository, key)
        elif key == 'accounting_repository':
            return await self._get_or_create_repository(AccountingRepository, key)
        elif key == 'advisor_repository':
            return await self._get_or_create_repository(AdvisorRepository, key)
        elif key == 'document_repository':
            return await self._get_or_create_repository(DocumentRepository, key)
        elif key == 'user_repository':
            return await self._get_or_create_repository(UserRepository, key)
        else:
            raise ValueError(f"Unknown repository key: {key}")

    # Repository methods
    async def get_analysis_repository(self) -> AnalysisRepository:
        return await self._get_or_create_repository(AnalysisRepository, 'analysis_repository')

    async def get_accounting_repository(self) -> AccountingRepository:
        return await self._get_or_create_repository(AccountingRepository, 'accounting_repository')

    async def get_advisor_repository(self) -> AdvisorRepository:
        return await self._get_or_create_repository(AdvisorRepository, 'advisor_repository')

    async def get_document_repository(self) -> DocumentRepository:
        return await self._get_or_create_repository(DocumentRepository, 'document_repository')

    async def get_user_repository(self) -> UserRepository:
        return await self._get_or_create_repository(UserRepository, 'user_repository')

    # Service methods
    async def get_analysis_service(self) -> AnalysisService:
        repo = await self.get_analysis_repository()
        return AnalysisService(repository=repo)

    async def get_accounting_service(self) -> AccountingService:
        repo = await self.get_accounting_repository()
        return AccountingService(repository=repo)

    async def get_advisor_service(self) -> AdvisorService:
        repo = await self.get_advisor_repository()
        return AdvisorService(repository=repo)

    async def get_document_service(self) -> DocumentService:
        repo = await self.get_document_repository()
        return DocumentService(repository=repo)

    async def get_user_service(self) -> UserService:
        repo = await self.get_user_repository()
        return UserService(repository=repo)

# Global container instance
container = DependencyContainer()

# FastAPI dependency functions
async def get_analysis_service() -> AnalysisService:
    """Dependency to get analysis service"""
    return await container.get_analysis_service()

async def get_accounting_service() -> AccountingService:
    """Dependency to get accounting service"""
    return await container.get_accounting_service()

async def get_advisor_service() -> AdvisorService:
    """Dependency to get advisor service"""
    return await container.get_advisor_service()

async def get_document_service() -> DocumentService:
    """Dependency to get document service"""
    return await container.get_document_service()

async def get_user_service() -> UserService:
    """Dependency to get user service"""
    return await container.get_user_service()

# Context manager for container lifecycle
@asynccontextmanager
async def container_context():
    """Context manager for container lifecycle"""
    try:
        await container.initialize()
        yield
    finally:
        await container.close()
