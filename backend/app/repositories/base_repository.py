"""
Base repository pattern for database operations using MongoDB (Motor)
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from bson import ObjectId
from ..core.database import get_mongodb

class BaseRepository(ABC):
    """Abstract base repository for database operations with MongoDB"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def collection(self):
        """Get MongoDB collection reference"""
        return get_mongodb()[self.collection_name]
    
    def _doc_to_dict(self, doc) -> Dict[str, Any]:
        """Convert MongoDB document to dict with 'id' field instead of '_id'"""
        if not doc:
            return None
        doc['id'] = str(doc.pop('_id'))
        return doc

    async def create(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create a new record"""
        try:
            if doc_id:
                data['_id'] = doc_id
                
            result = await self.collection.insert_one(data)
            created_doc = await self.collection.find_one({"_id": result.inserted_id})
            return self._doc_to_dict(created_doc)
        except Exception as e:
            raise Exception(f"Failed to create {self.collection_name}: {str(e)}")
    
    async def get_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Get record by ID"""
        try:
            # Try as string ID first (Firestore style), then as ObjectId
            doc = await self.collection.find_one({"_id": record_id})
            if not doc:
                try:
                    doc = await self.collection.find_one({"_id": ObjectId(record_id)})
                except:
                    pass
            return self._doc_to_dict(doc)
        except Exception as e:
            raise Exception(f"Failed to get {self.collection_name} by ID: {str(e)}")
    
    async def get_by_field(self, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get single record by field value"""
        try:
            doc = await self.collection.find_one({field: value})
            return self._doc_to_dict(doc)
        except Exception as e:
            raise Exception(f"Failed to get {self.collection_name} by {field}: {str(e)}")
    
    async def get_all(self, filters: Optional[Dict[str, Any]] = None, limit: int = 100, offset: int = 0, order_by: str = "created_at", descending: bool = True) -> List[Dict[str, Any]]:
        """Get all records with optional filters"""
        try:
            query_filters = filters or {}
            cursor = self.collection.find(query_filters)
            
            if order_by:
                direction = -1 if descending else 1
                cursor = cursor.sort(order_by, direction)
            
            cursor = cursor.skip(offset).limit(limit)
            docs = await cursor.to_list(length=limit)
            return [self._doc_to_dict(doc) for doc in docs]
        except Exception as e:
            raise Exception(f"Failed to get {self.collection_name} records: {str(e)}")
    
    async def update(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update record by ID"""
        try:
            # Try update with string ID or ObjectId
            query = {"_id": record_id}
            result = await self.collection.update_one(query, {"$set": data})
            
            if result.matched_count == 0:
                try:
                    query = {"_id": ObjectId(record_id)}
                    await self.collection.update_one(query, {"$set": data})
                except:
                    pass
                    
            updated_doc = await self.collection.find_one(query)
            return self._doc_to_dict(updated_doc)
        except Exception as e:
            raise Exception(f"Failed to update {self.collection_name}: {str(e)}")
    
    async def delete(self, record_id: str) -> bool:
        """Delete record by ID"""
        try:
            query = {"_id": record_id}
            result = await self.collection.delete_one(query)
            
            if result.deleted_count == 0:
                try:
                    query = {"_id": ObjectId(record_id)}
                    await self.collection.delete_one(query)
                except:
                    pass
            return True
        except Exception as e:
            raise Exception(f"Failed to delete {self.collection_name}: {str(e)}")
    
    @abstractmethod
    async def get_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        """Get records by user ID - must be implemented by subclasses"""
        pass
