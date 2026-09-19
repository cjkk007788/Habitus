import logging
from typing import Dict, Any, List
from app.services.http_client import api_request

logger = logging.getLogger(__name__)

import urllib.parse
import asyncio

logger = logging.getLogger(__name__)

WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"
WIKIPEDIA_EN_API_URL = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_KO_API_URL = "https://ko.wikipedia.org/w/api.php"

async def _fetch_wikidata(query: str, limit: int) -> List[Dict[str, Any]]:
    params = {
        "action": "wbsearchentities",
        "search": query,
        "language": "en",
        "uselang": "ko",
        "format": "json",
        "type": "item",
        "limit": limit
    }
    data = await api_request(WIKIDATA_API_URL, params=params, timeout=5.0)
    results = []
    if data and "search" in data:
        for item in data["search"]:
            results.append({
                "id": item.get("id"),
                "name": item.get("label", query),
                "description": item.get("description", ""),
            })
    return results

async def _get_spellcheck_suggestion(query: str) -> str:
    """Uses Wikipedia's opensearch which has excellent typo tolerance."""
    # Run English and Korean opensearch concurrently
    en_params = {"action": "opensearch", "search": query, "limit": 1, "namespace": 0, "format": "json"}
    ko_params = {"action": "opensearch", "search": query, "limit": 1, "namespace": 0, "format": "json"}
    
    en_task = api_request(WIKIPEDIA_EN_API_URL, params=en_params, timeout=3.0)
    ko_task = api_request(WIKIPEDIA_KO_API_URL, params=ko_params, timeout=3.0)
    
    en_data, ko_data = await asyncio.gather(en_task, ko_task, return_exceptions=True)
    
    # opensearch returns [query, [suggestions], [descriptions], [urls]]
    # We want the first suggestion if available.
    # Prioritize Korean if the query has Korean characters, otherwise English.
    has_korean = any(ord(c) >= 0xAC00 and ord(c) <= 0xD7A3 for c in query)
    
    first_choice = ko_data if has_korean else en_data
    second_choice = en_data if has_korean else ko_data
    
    for data in [first_choice, second_choice]:
        if isinstance(data, list) and len(data) >= 2 and data[1]:
            return data[1][0] # Return the first corrected suggestion
            
    return ""

async def search_entities(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search Wikidata for entities (people, bands, authors) by name.
    It simultaneously checks Wikipedia's opensearch for typo corrections
    and merges the results from both the raw query and the corrected query.
    """
    try:
        # Run raw wikidata search and spellcheck concurrently
        raw_task = _fetch_wikidata(query, limit)
        spellcheck_task = _get_spellcheck_suggestion(query)
        
        raw_results, corrected_query = await asyncio.gather(raw_task, spellcheck_task, return_exceptions=True)
        
        if isinstance(raw_results, Exception):
            raw_results = []
            
        corrected_results = []
        if isinstance(corrected_query, str) and corrected_query and corrected_query.lower() != query.lower():
            logger.info(f"Wikidata spellcheck suggests '{corrected_query}' for raw query '{query}'")
            corrected_results = await _fetch_wikidata(corrected_query, limit)
            
        # Merge results, prioritizing corrected results, while preventing duplicates
        final_results = []
        seen_ids = set()
        
        # Add corrected results first (higher probability of being what the user meant)
        for item in corrected_results:
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                final_results.append(item)
                
        # Then add raw results
        for item in raw_results:
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                final_results.append(item)
                
        return final_results[:limit]
        
    except Exception as e:
        logger.error(f"Wikidata API error: {e}")
        return []
